import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  TypeUtilisateur,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import { optimizeDocument } from '../utils/document-optimizer';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateUserDocumentsDto } from './dto/update-user-documents.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly MAX_FILE_SIZE = 500 * 1024; // 500 KB

  private normalizePhone(phone: string): string {
    return (phone || '').trim();
  }

  private normalizeEmail(email: string): string {
    return (email || '').trim().toLowerCase();
  }

  private toDate(value?: string): Date | undefined {
    if (!value) return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException({
        message: 'Date invalide.',
        messageE: 'Invalid date.',
      });
    }
    return d;
  }

  private getBase64Size(dataUrl: string): number {
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return 0;
    return Buffer.from(matches[2], 'base64').length;
  }

  private async normalizeAndUploadAsset(
    input: string,
    folder: string,
  ): Promise<string> {
    if (!input) {
      throw new BadRequestException({
        message: 'Fichier vide.',
        messageE: 'Empty file.',
      });
    }

    if (input.startsWith('http://') || input.startsWith('https://')) {
      return input;
    }

    const optimized = await optimizeDocument(input);
    const finalSize = this.getBase64Size(optimized);

    if (finalSize > this.MAX_FILE_SIZE) {
      throw new BadRequestException({
        message:
          'Le fichier dépasse 500 Ko après optimisation.',
        messageE:
          'The file exceeds 500 KB after optimization.',
      });
    }

    return await uploadImageToCloudinary(optimized, folder);
  }

  private async normalizeAndUploadMany(
    files: string[],
    folder: string,
  ): Promise<string[]> {
    return await Promise.all(
      files.map((file) => this.normalizeAndUploadAsset(file, folder)),
    );
  }

  private async resolveRoleForType(type: TypeUtilisateur) {
    const roleNameCandidates =
      type === TypeUtilisateur.SUPERADMIN
        ? ['SUPER_ADMIN', 'SUPERADMIN']
        : [type];

    const role = await this.prisma.role.findFirst({
      where: {
        nom: {
          in: roleNameCandidates,
        },
      },
    });

    if (!role) {
      throw new BadRequestException({
        message: `Aucun rôle trouvé pour le type ${type}.`,
        messageE: `No role found for type ${type}.`,
      });
    }

    return role;
  }

  private async validateCreateUniqueness(dto: CreateUserDto) {
    const normalizedPhone = this.normalizePhone(dto.telephone);
    const normalizedEmail = this.normalizeEmail(dto.email);

    const existingPhone = await this.prisma.utilisateur.findFirst({
      where: {
        telephone: normalizedPhone,
        type: dto.type,
      },
      select: { id: true },
    });

    if (existingPhone) {
      throw new ConflictException({
        message:
          'Un utilisateur de ce type existe déjà avec ce téléphone.',
        messageE:
          'A user of this type already exists with this phone number.',
      });
    }

    const existingEmail = await this.prisma.utilisateur.findFirst({
      where: {
        type: dto.type,
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });

    if (existingEmail) {
      throw new ConflictException({
        message:
          'Un utilisateur de ce type existe déjà avec cet email.',
        messageE:
          'A user of this type already exists with this email.',
      });
    }
  }

  private async validateUpdateUniqueness(id: number, dto: UpdateUserDto) {
    if (dto.telephone && dto.type) {
      const existingPhone = await this.prisma.utilisateur.findFirst({
        where: {
          id: { not: id },
          telephone: this.normalizePhone(dto.telephone),
          type: dto.type,
        },
        select: { id: true },
      });

      if (existingPhone) {
        throw new ConflictException({
          message:
            'Un utilisateur de ce type existe déjà avec ce téléphone.',
          messageE:
            'A user of this type already exists with this phone number.',
        });
      }
    }

    if (dto.email && dto.type) {
      const existingEmail = await this.prisma.utilisateur.findFirst({
        where: {
          id: { not: id },
          type: dto.type,
          email: {
            equals: this.normalizeEmail(dto.email),
            mode: 'insensitive',
          },
        },
        select: { id: true },
      });

      if (existingEmail) {
        throw new ConflictException({
          message:
            'Un utilisateur de ce type existe déjà avec cet email.',
          messageE:
            'A user of this type already exists with this email.',
        });
      }
    }
  }

  private async ensureUser(id: number) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
        adresses: true,
        documents: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        message: 'Utilisateur introuvable.',
        messageE: 'User not found.',
      });
    }

    return user;
  }

  private mapUser(user: any) {
    return {
      id: user.id,
      nom: user.nom,
      email: user.email,
      telephone: user.telephone,
      date_naissance: user.date_naissance
        ? user.date_naissance.toISOString()
        : null,
      genre: user.genre ?? null,
      type: user.type,
      is_verified: user.is_verified,
      is_block: user.is_block,
      nombre_attempts: user.nombre_attempts,
      photo_url: user.photo_url ?? null,
      derniere_connexion: user.derniere_connexion
        ? user.derniere_connexion.toISOString()
        : null,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
      roles: Array.isArray(user.roles)
        ? user.roles.map((r: any) => r.role?.nom).filter(Boolean)
        : [],
      adresses: Array.isArray(user.adresses)
        ? user.adresses.map((a: any) => ({
            id: a.id,
            country: a.country,
            city: a.city,
            address: a.address,
            longitude: a.longitude ?? null,
            latitude: a.latitude ?? null,
          }))
        : [],
      documents: Array.isArray(user.documents)
        ? user.documents.map((d: any) => ({
            id: d.id,
            nom: d.nom ?? null,
            images: d.images ?? [],
          }))
        : [],
    };
  }

private async prepareDocuments(
  documents: { nom?: string; images: string[] }[],
  userId?: number,
): Promise<Array<{ nom: string | null; images: string[] }>> {
  const prepared: Array<{ nom: string | null; images: string[] }> = [];

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const uploadedImages = await this.normalizeAndUploadMany(
      doc.images,
      `dezoumay/users/${userId ?? 'new-user'}/documents/${i + 1}`,
    );

    prepared.push({
      nom: doc.nom ?? null,
      images: uploadedImages,
    });
  }

  return prepared;
}

  async create(dto: CreateUserDto) {
    await this.validateCreateUniqueness(dto);

    if (
      dto.type === TypeUtilisateur.INSTITUT &&
      (!dto.documents || !dto.documents.length)
    ) {
      throw new BadRequestException({
        message:
          'Les images/documents de l’institut sont obligatoires.',
        messageE:
          'Institute images/documents are required.',
      });
    }

    const hashedPassword = await bcrypt.hash(dto.mot_de_passe, 10);

    const photoUrl = dto.photo_url
      ? await this.normalizeAndUploadAsset(
          dto.photo_url,
          'dezoumay/users/profile',
        )
      : null;

    const preparedDocuments = dto.documents?.length
      ? await this.prepareDocuments(dto.documents)
      : [];

    const role = await this.resolveRoleForType(dto.type);

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.utilisateur.create({
        data: {
          nom: dto.nom.trim(),
          email: this.normalizeEmail(dto.email),
          telephone: this.normalizePhone(dto.telephone),
          mot_de_passe: hashedPassword,
          date_naissance: this.toDate(dto.date_naissance),
          genre: dto.genre,
          type: dto.type,
          photo_url: photoUrl,
          adresses: dto.adresses?.length
            ? {
                create: dto.adresses.map((a) => ({
                  country: a.country,
                  city: a.city,
                  address: a.address,
                  longitude: a.longitude,
                  latitude: a.latitude,
                })),
              }
            : undefined,
          documents: preparedDocuments.length
            ? {
                create: preparedDocuments.map((d) => ({
                  nom: d.nom,
                  images: d.images,
                })),
              }
            : undefined,
        },
        include: {
          adresses: true,
          documents: true,
          roles: { include: { role: true } },
        },
      });

      await tx.utilisateurRole.create({
        data: {
          utilisateurId: user.id,
          roleId: role.id,
        },
      });

      const finalUser = await tx.utilisateur.findUnique({
        where: { id: user.id },
        include: {
          roles: { include: { role: true } },
          adresses: true,
          documents: true,
        },
      });

      return finalUser!;
    });

    return {
      message: 'Utilisateur créé avec succès.',
      messageE: 'User created successfully.',
      data: this.mapUser(created),
    };
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.ensureUser(id);

    await this.validateUpdateUniqueness(id, dto);

    const photoUrl = dto.photo_url
      ? await this.normalizeAndUploadAsset(
          dto.photo_url,
          `dezoumay/users/${id}/profile`,
        )
      : undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.utilisateur.update({
        where: { id },
        data: {
          nom: dto.nom?.trim(),
          email: dto.email ? this.normalizeEmail(dto.email) : undefined,
          telephone: dto.telephone
            ? this.normalizePhone(dto.telephone)
            : undefined,
          date_naissance: dto.date_naissance
            ? this.toDate(dto.date_naissance)
            : undefined,
          genre: dto.genre,
          type: dto.type,
          photo_url: photoUrl,
        },
      });

      if (dto.type) {
        const role = await this.resolveRoleForType(dto.type);

        await tx.utilisateurRole.deleteMany({
          where: { utilisateurId: id },
        });

        await tx.utilisateurRole.create({
          data: {
            utilisateurId: id,
            roleId: role.id,
          },
        });
      }

      const finalUser = await tx.utilisateur.findUnique({
        where: { id },
        include: {
          roles: { include: { role: true } },
          adresses: true,
          documents: true,
        },
      });

      return finalUser!;
    });

    return {
      message: 'Utilisateur mis à jour avec succès.',
      messageE: 'User updated successfully.',
      data: this.mapUser(updated),
    };
  }

  async getAll(query: QueryUserDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UtilisateurWhereInput = {};

    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { nom: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { telephone: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (query.type) where.type = query.type;
    if (query.genre) where.genre = query.genre;
    if (typeof query.is_block === 'boolean') where.is_block = query.is_block;
    if (typeof query.is_verified === 'boolean') {
      where.is_verified = query.is_verified;
    }

    const [total, users] = await Promise.all([
      this.prisma.utilisateur.count({ where }),
      this.prisma.utilisateur.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          roles: { include: { role: true } },
          adresses: true,
          documents: true,
        },
      }),
    ]);

    return {
      message: 'Liste des utilisateurs récupérée avec succès.',
      messageE: 'Users fetched successfully.',
      data: users.map((u) => this.mapUser(u)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getOne(id: number) {
    const user = await this.ensureUser(id);

    return {
      message: 'Utilisateur récupéré avec succès.',
      messageE: 'User fetched successfully.',
      data: this.mapUser(user),
    };
  }

  async block(id: number) {
    await this.ensureUser(id);

    await this.prisma.utilisateur.update({
      where: { id },
      data: { is_block: true },
    });

    return {
      message: 'Utilisateur bloqué avec succès.',
      messageE: 'User blocked successfully.',
    };
  }

  async unblock(id: number) {
    await this.ensureUser(id);

    await this.prisma.utilisateur.update({
      where: { id },
      data: {
        is_block: false,
        nombre_attempts: 0,
      },
    });

    return {
      message: 'Utilisateur débloqué avec succès.',
      messageE: 'User unblocked successfully.',
    };
  }

  async verify(id: number) {
    await this.ensureUser(id);

    await this.prisma.utilisateur.update({
      where: { id },
      data: { is_verified: true },
    });

    return {
      message: 'Utilisateur vérifié avec succès.',
      messageE: 'User verified successfully.',
    };
  }

  async replaceDocuments(id: number, dto: UpdateUserDocumentsDto) {
    const user = await this.ensureUser(id);

    if (
      user.type === TypeUtilisateur.INSTITUT &&
      (!dto.documents || !dto.documents.length)
    ) {
      throw new BadRequestException({
        message:
          'Un institut doit toujours avoir au moins un document.',
        messageE:
          'An institute must always have at least one document.',
      });
    }

    const preparedDocuments = await this.prepareDocuments(
      dto.documents,
      id,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.document.deleteMany({
        where: { utilisateurId: id },
      });

      for (const doc of preparedDocuments) {
        await tx.document.create({
          data: {
            utilisateurId: id,
            nom: doc.nom,
            images: doc.images,
          },
        });
      }
    });

    const documents = await this.prisma.document.findMany({
      where: { utilisateurId: id },
      orderBy: { id: 'desc' },
    });

    return {
      message: 'Documents mis à jour avec succès.',
      messageE: 'Documents updated successfully.',
      data: documents.map((d) => ({
        id: d.id,
        nom: d.nom ?? null,
        images: d.images,
      })),
    };
  }

  async addAddress(userId: number, dto: CreateAddressDto) {
    await this.ensureUser(userId);

    const address = await this.prisma.adresse.create({
      data: {
        utilisateurId: userId,
        country: dto.country,
        city: dto.city,
        address: dto.address,
        longitude: dto.longitude,
        latitude: dto.latitude,
      },
    });

    return {
      message: 'Adresse enregistrée avec succès.',
      messageE: 'Address saved successfully.',
      data: {
        id: address.id,
        country: address.country,
        city: address.city,
        address: address.address,
        longitude: address.longitude ?? null,
        latitude: address.latitude ?? null,
      },
    };
  }

  async getAddresses(userId: number) {
    await this.ensureUser(userId);

    const addresses = await this.prisma.adresse.findMany({
      where: { utilisateurId: userId },
      orderBy: { id: 'desc' },
    });

    return {
      message: 'Adresses récupérées avec succès.',
      messageE: 'Addresses fetched successfully.',
      data: addresses.map((a) => ({
        id: a.id,
        country: a.country,
        city: a.city,
        address: a.address,
        longitude: a.longitude ?? null,
        latitude: a.latitude ?? null,
      })),
    };
  }

  async updateAddress(
    userId: number,
    addressId: number,
    dto: UpdateAddressDto,
  ) {
    await this.ensureUser(userId);

    const existing = await this.prisma.adresse.findFirst({
      where: {
        id: addressId,
        utilisateurId: userId,
      },
    });

    if (!existing) {
      throw new NotFoundException({
        message: 'Adresse introuvable.',
        messageE: 'Address not found.',
      });
    }

    const updated = await this.prisma.adresse.update({
      where: { id: addressId },
      data: {
        country: dto.country,
        city: dto.city,
        address: dto.address,
        longitude: dto.longitude,
        latitude: dto.latitude,
      },
    });

    return {
      message: 'Adresse mise à jour avec succès.',
      messageE: 'Address updated successfully.',
      data: {
        id: updated.id,
        country: updated.country,
        city: updated.city,
        address: updated.address,
        longitude: updated.longitude ?? null,
        latitude: updated.latitude ?? null,
      },
    };
  }

  async getDocuments(userId: number) {
    await this.ensureUser(userId);

    const documents = await this.prisma.document.findMany({
      where: { utilisateurId: userId },
      orderBy: { id: 'desc' },
    });

    return {
      message: 'Documents récupérés avec succès.',
      messageE: 'Documents fetched successfully.',
      data: documents.map((d) => ({
        id: d.id,
        nom: d.nom ?? null,
        images: d.images,
      })),
    };
  }
}