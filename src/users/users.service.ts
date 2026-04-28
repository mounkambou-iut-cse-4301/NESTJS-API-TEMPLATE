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

  private async processUserMedia(userId: number, dto: CreateUserDto) {
    try {
      console.log(`📤 Début du traitement des médias pour l'utilisateur ${userId}...`);
      
      // Upload de la photo de profil
      let photoUrl: string | null = null;
      if (dto.photo_url) {
        console.log(`📸 Upload de la photo de profil...`);
        photoUrl = await this.normalizeAndUploadAsset(
          dto.photo_url,
          `dezoumay/users/${userId}/profile`,
        );
      }

      // Upload des documents
      let preparedDocuments: Array<{ nom: string | null; images: string[] }> = [];
      if (dto.documents && dto.documents.length > 0) {
        console.log(`📄 Upload de ${dto.documents.length} document(s)...`);
        preparedDocuments = await this.prepareDocuments(dto.documents, userId);
      }

      // Mise à jour de l'utilisateur avec les médias traités
      await this.prisma.utilisateur.update({
        where: { id: userId },
        data: {
          photo_url: photoUrl,
          documents: preparedDocuments.length
            ? {
                create: preparedDocuments.map((d) => ({
                  nom: d.nom,
                  images: d.images,
                })),
              }
            : undefined,
        },
      });

      console.log(`✅ Médias traités avec succès pour l'utilisateur ${userId}`);
    } catch (error) {
      console.error(`❌ Erreur de traitement des médias pour l'utilisateur ${userId}:`, error);
      
      // Optionnel: Marquer l'utilisateur comme ayant besoin d'un retraitement
      // ou ajouter une entrée dans une table de logs d'erreurs
      await this.prisma.utilisateur.update({
        where: { id: userId },
        data: {
          // Vous pouvez ajouter un champ `media_processing_error` à votre schéma Prisma
          // ou simplement logger l'erreur
        },
      });
      
      throw error;
    }
  }

  async create(dto: CreateUserDto) {
    // Validation des données
    await this.validateCreateUniqueness(dto);

    // Vérification des documents obligatoires pour les instituts
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

    // Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(dto.mot_de_passe, 10);

    // Création de l'utilisateur sans les médias (pour éviter le timeout)
    const created = await this.prisma.utilisateur.create({
      data: {
        nom: dto.nom.trim(),
        email: this.normalizeEmail(dto.email),
        telephone: this.normalizePhone(dto.telephone),
        mot_de_passe: hashedPassword,
        date_naissance: this.toDate(dto.date_naissance),
        genre: dto.genre,
        type: dto.type,
        photo_url: null, // Sera mis à jour plus tard par le traitement asynchrone
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
        // Ne pas inclure les documents ici
      },
      include: {
        adresses: true,
        documents: true,
      },
    });

    // Traitement asynchrone des médias (photo et documents)
    // Cela ne bloque pas la réponse et évite les timeouts
    this.processUserMedia(created.id, dto).catch((error) => {
      console.error(`Erreur lors du traitement asynchrone des médias pour l'utilisateur ${created.id}:`, error);
    });

    return {
      message: 'Utilisateur créé avec succès. Les photos et documents sont en cours de traitement.',
      messageE: 'User created successfully. Media is being processed.',
      data: this.mapUser(created),
    };
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.ensureUser(id);

    await this.validateUpdateUniqueness(id, dto);

    // Si des médias sont fournis, les traiter de manière asynchrone
    const hasMediaToProcess = dto.photo_url || (dto.documents && dto.documents.length > 0);

    // Mise à jour des informations de base sans les médias
    const updated = await this.prisma.utilisateur.update({
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
        // Ne pas mettre à jour photo_url ici si elle est fournie
        photo_url: dto.photo_url ? null : undefined,
      },
      include: {
        adresses: true,
        documents: true,
      },
    });

    // Traitement asynchrone des nouveaux médias
    if (hasMediaToProcess) {
      this.processUserMediaUpdate(id, dto).catch((error) => {
        console.error(`Erreur lors du traitement asynchrone des médias pour la mise à jour de l'utilisateur ${id}:`, error);
      });
    }

    return {
      message: 'Utilisateur mis à jour avec succès. Les nouveaux médias sont en cours de traitement.',
      messageE: 'User updated successfully. New media is being processed.',
      data: this.mapUser(updated),
    };
  }

  private async processUserMediaUpdate(userId: number, dto: UpdateUserDto) {
    try {
      console.log(`📤 Début du traitement des médias pour la mise à jour de l'utilisateur ${userId}...`);
      
      const updateData: any = {};

      // Upload de la nouvelle photo de profil
      if (dto.photo_url) {
        console.log(`📸 Upload de la nouvelle photo de profil...`);
        updateData.photo_url = await this.normalizeAndUploadAsset(
          dto.photo_url,
          `dezoumay/users/${userId}/profile`,
        );
      }

      // Upload des nouveaux documents (remplacement complet)
      if (dto.documents && dto.documents.length > 0) {
        console.log(`📄 Upload de ${dto.documents.length} nouveau(x) document(s)...`);
        
        // Supprimer les anciens documents
        await this.prisma.document.deleteMany({
          where: { utilisateurId: userId },
        });

        // Upload des nouveaux documents
        const preparedDocuments = await this.prepareDocuments(dto.documents, userId);
        
        if (preparedDocuments.length) {
          updateData.documents = {
            create: preparedDocuments.map((d) => ({
              nom: d.nom,
              images: d.images,
            })),
          };
        }
      }

      // Mise à jour de l'utilisateur avec les nouveaux médias
      if (Object.keys(updateData).length > 0) {
        await this.prisma.utilisateur.update({
          where: { id: userId },
          data: updateData,
        });
      }

      console.log(`✅ Médias mis à jour avec succès pour l'utilisateur ${userId}`);
    } catch (error) {
      console.error(`❌ Erreur de traitement des médias pour la mise à jour de l'utilisateur ${userId}:`, error);
      throw error;
    }
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

    // Traitement asynchrone des documents
    this.processDocumentReplacement(id, dto).catch((error) => {
      console.error(`Erreur lors du remplacement asynchrone des documents pour l'utilisateur ${id}:`, error);
    });

    return {
      message: 'Remplacement des documents initié. Les nouveaux documents seront traités en arrière-plan.',
      messageE: 'Document replacement initiated. New documents will be processed in the background.',
      data: {
        status: 'processing',
        estimated_time: 'quelques secondes',
      },
    };
  }

  private async processDocumentReplacement(id: number, dto: UpdateUserDocumentsDto) {
    try {
      console.log(`📄 Début du remplacement des documents pour l'utilisateur ${id}...`);

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

      console.log(`✅ Documents remplacés avec succès pour l'utilisateur ${id}`);
    } catch (error) {
      console.error(`❌ Erreur lors du remplacement des documents pour l'utilisateur ${id}:`, error);
      throw error;
    }
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

  // Méthode utilitaire pour vérifier le statut du traitement des médias
  async getMediaProcessingStatus(userId: number) {
    const user = await this.ensureUser(userId);
    
    return {
      message: 'Statut des médias récupéré avec succès.',
      messageE: 'Media status fetched successfully.',
      data: {
        has_photo: !!user.photo_url,
        documents_count: user.documents?.length || 0,
        is_fully_processed: !!user.photo_url || user.type !== TypeUtilisateur.INSTITUT 
          ? true 
          : (user.documents?.length > 0),
      },
    };
  }
}