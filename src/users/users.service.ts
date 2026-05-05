import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TypeUtilisateur } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type PictureInput = string | Express.Multer.File | null | undefined;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  private readonly CLOUDINARY_USER_FOLDER = 'collect-femme/users/pictures';
  private readonly CLOUDINARY_TIMEOUT_MS = 15_000;

  constructor(private readonly prisma: PrismaService) {}

  private normalizeText(value?: string | null): string | undefined {
    const clean = String(value || '').trim().replace(/\s+/g, ' ');
    return clean || undefined;
  }

  private normalizeEmail(value?: string | null): string | undefined {
    const clean = String(value || '').trim().toLowerCase();
    return clean || undefined;
  }

  private normalizePhone(value?: string | null): string | undefined {
    const clean = String(value || '').trim();
    return clean || undefined;
  }

  private isRemoteUrl(value?: string | null): boolean {
    return !!value && (value.startsWith('http://') || value.startsWith('https://'));
  }

  private getPagination(page?: number, limit?: number) {
    const safePage = Math.max(1, Number(page || 1));
    const safeLimit = Math.min(100, Math.max(1, Number(limit || 10)));

    return {
      page: safePage,
      limit: safeLimit,
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    };
  }

  private buildMeta(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  private getUserInclude(): Prisma.UtilisateurInclude {
    return {
      region: {
        select: { id: true, name: true, nameEn: true },
      },
      departement: {
        select: { id: true, name: true, nameEn: true },
      },
      groupe: {
        select: { id: true, name: true },
      },
      zone: {
        select: { id: true, name: true },
      },
    };
  }

  private mapUser(user: any) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email,
      phone: user.phone,
      type: user.type,
      picture: user.picture,
      isBlock: user.isBlock,
      isVerified: user.isVerified,
      isDeleted: user.isDeleted,
      loginAttempt: user.loginAttempt,
      regionId: user.regionId,
      departementId: user.departementId,
      groupeId: user.groupeId,
      zoneId: user.zoneId,
      region: user.region
        ? {
            id: user.region.id,
            name: user.region.name,
            nameEn: user.region.nameEn,
          }
        : null,
      departement: user.departement
        ? {
            id: user.departement.id,
            name: user.departement.name,
            nameEn: user.departement.nameEn,
          }
        : null,
      groupe: user.groupe
        ? {
            id: user.groupe.id,
            name: user.groupe.name,
          }
        : null,
      zone: user.zone
        ? {
            id: user.zone.id,
            name: user.zone.name,
          }
        : null,
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    };
  }

  private async ensureUniqueEmailAndPhone(
    email: string,
    phone: string,
    excludeUserId?: number,
  ) {
    const existingEmail = await this.prisma.utilisateur.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true },
    });

    if (existingEmail) {
      throw new ConflictException({
        message: 'Cette adresse email est déjà utilisée.',
        messageE: 'This email address is already used.',
      });
    }

    const existingPhone = await this.prisma.utilisateur.findFirst({
      where: {
        phone,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true },
    });

    if (existingPhone) {
      throw new ConflictException({
        message: 'Ce numéro de téléphone est déjà utilisé.',
        messageE: 'This phone number is already used.',
      });
    }
  }

  private async validateGeographie(dto: {
    regionId?: number | null;
    departementId?: number | null;
    groupeId?: number | null;
    zoneId?: number | null;
  }) {
    if (dto.regionId) {
      const region = await this.prisma.region.findUnique({
        where: { id: dto.regionId },
        select: { id: true },
      });

      if (!region) {
        throw new NotFoundException({
          message: 'Région introuvable.',
          messageE: 'Region not found.',
        });
      }
    }

    if (dto.departementId) {
      const departement = await this.prisma.departement.findUnique({
        where: { id: dto.departementId },
        select: { id: true, regionId: true },
      });

      if (!departement) {
        throw new NotFoundException({
          message: 'Département introuvable.',
          messageE: 'Division not found.',
        });
      }

      if (dto.regionId && departement.regionId !== dto.regionId) {
        throw new BadRequestException({
          message: 'Le département ne correspond pas à la région indiquée.',
          messageE: 'The division does not belong to the selected region.',
        });
      }
    }

    if (dto.groupeId) {
      const groupe = await this.prisma.groupe.findUnique({
        where: { id: dto.groupeId },
        select: { id: true, regionId: true },
      });

      if (!groupe) {
        throw new NotFoundException({
          message: 'Groupe introuvable.',
          messageE: 'Group not found.',
        });
      }

      if (dto.regionId && groupe.regionId !== dto.regionId) {
        throw new BadRequestException({
          message: 'Le groupe ne correspond pas à la région indiquée.',
          messageE: 'The group does not belong to the selected region.',
        });
      }
    }

    if (dto.zoneId) {
      const zone = await this.prisma.zone.findUnique({
        where: { id: dto.zoneId },
        select: {
          id: true,
          groupeId: true,
          departementId: true,
          groupe: {
            select: {
              regionId: true,
            },
          },
        },
      });

      if (!zone) {
        throw new NotFoundException({
          message: 'Zone introuvable.',
          messageE: 'Zone not found.',
        });
      }

      if (dto.groupeId && zone.groupeId !== dto.groupeId) {
        throw new BadRequestException({
          message: 'La zone ne correspond pas au groupe indiqué.',
          messageE: 'The zone does not belong to the selected group.',
        });
      }

      if (dto.departementId && zone.departementId !== dto.departementId) {
        throw new BadRequestException({
          message: 'La zone ne correspond pas au département indiqué.',
          messageE: 'The zone does not belong to the selected division.',
        });
      }

      if (dto.regionId && zone.groupe.regionId !== dto.regionId) {
        throw new BadRequestException({
          message: 'La zone ne correspond pas à la région indiquée.',
          messageE: 'The zone does not belong to the selected region.',
        });
      }
    }
  }

  private uploadWithTimeout(
    input: string | Express.Multer.File,
    folder: string,
  ): Promise<string> {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<string>((_, reject) => {
      timeout = setTimeout(() => {
        reject(
          new Error(
            `Upload Cloudinary trop long après ${this.CLOUDINARY_TIMEOUT_MS / 1000}s.`,
          ),
        );
      }, this.CLOUDINARY_TIMEOUT_MS);
    });

    return Promise.race([
      uploadImageToCloudinary(input, folder),
      timeoutPromise,
    ]).finally(() => {
      if (timeout) clearTimeout(timeout);
    });
  }

  /**
   * Upload non bloquant.
   * La création/mise à jour de l'utilisateur est déjà terminée.
   * En cas d'échec Cloudinary, on log seulement, on ne casse pas la requête.
   */
  private startPictureUploadInBackground(
    userId: number,
    pictureInput: string | Express.Multer.File,
  ): void {
    void this.uploadWithTimeout(pictureInput, this.CLOUDINARY_USER_FOLDER)
      .then(async (pictureUrl) => {
        await this.prisma.utilisateur.update({
          where: { id: userId },
          data: { picture: pictureUrl },
        });

        this.logger.log(
          `Photo utilisateur uploadée avec succès sur Cloudinary. userId=${userId}`,
        );
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : 'Erreur inconnue Cloudinary';

        this.logger.warn(
          `Upload photo utilisateur échoué sans bloquer la requête. userId=${userId}. Raison: ${message}`,
        );
      });
  }

  private preparePictureForCreate(picture?: string | null) {
    if (!picture) {
      return {
        immediatePictureUrl: null as string | null,
        backgroundPictureInput: null as string | null,
        pictureUploadStatus: 'NONE' as const,
      };
    }

    if (this.isRemoteUrl(picture)) {
      return {
        immediatePictureUrl: picture,
        backgroundPictureInput: null as string | null,
        pictureUploadStatus: 'DONE' as const,
      };
    }

    return {
      immediatePictureUrl: null as string | null,
      backgroundPictureInput: picture,
      pictureUploadStatus: 'PROCESSING' as const,
    };
  }

  private preparePictureForUpdate(
    picture?: string | null,
    pictureFile?: Express.Multer.File,
  ) {
    if (pictureFile) {
      return {
        immediatePictureUrl: undefined as string | undefined,
        backgroundPictureInput: pictureFile as PictureInput,
        pictureUploadStatus: 'PROCESSING' as const,
      };
    }

    if (picture === undefined) {
      return {
        immediatePictureUrl: undefined as string | undefined,
        backgroundPictureInput: null as PictureInput,
        pictureUploadStatus: 'UNCHANGED' as const,
      };
    }

    if (picture === null || picture === '') {
      return {
        immediatePictureUrl: null as string | null,
        backgroundPictureInput: null as PictureInput,
        pictureUploadStatus: 'REMOVED' as const,
      };
    }

    if (this.isRemoteUrl(picture)) {
      return {
        immediatePictureUrl: picture,
        backgroundPictureInput: null as PictureInput,
        pictureUploadStatus: 'DONE' as const,
      };
    }

    return {
      immediatePictureUrl: undefined as string | undefined,
      backgroundPictureInput: picture,
      pictureUploadStatus: 'PROCESSING' as const,
    };
  }

  async create(dto: CreateUserDto, pictureFile?: Express.Multer.File) {
    const firstName = this.normalizeText(dto.firstName);
    const lastName = this.normalizeText(dto.lastName);
    const email = this.normalizeEmail(dto.email);
    const phone = this.normalizePhone(dto.phone);

    if (!firstName || !lastName || !email || !phone) {
      throw new BadRequestException({
        message: 'Le prénom, le nom, l’email et le téléphone sont obligatoires.',
        messageE: 'First name, last name, email and phone are required.',
      });
    }

    await this.ensureUniqueEmailAndPhone(email, phone);
    await this.validateGeographie(dto);

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const picturePreparation = pictureFile
      ? {
          immediatePictureUrl: null as string | null,
          backgroundPictureInput: pictureFile as PictureInput,
          pictureUploadStatus: 'PROCESSING' as const,
        }
      : this.preparePictureForCreate(dto.picture);

    const createData: Prisma.UtilisateurUncheckedCreateInput = {
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      type: dto.type,
      picture: picturePreparation.immediatePictureUrl,
      isVerified: true,
      isBlock: false,
      isDeleted: false,
      loginAttempt: 0,
      regionId: dto.regionId ?? null,
      departementId: dto.departementId ?? null,
      groupeId: dto.groupeId ?? null,
      zoneId: dto.zoneId ?? null,
    };

    const user = await this.prisma.utilisateur.create({
      data: createData,
      include: this.getUserInclude(),
    });

    if (picturePreparation.backgroundPictureInput) {
      this.startPictureUploadInBackground(
        user.id,
        picturePreparation.backgroundPictureInput,
      );
    }

    return {
      message: 'Utilisateur créé avec succès.',
      messageE: 'User created successfully.',
      data: {
        ...this.mapUser(user),
        pictureUploadStatus: picturePreparation.pictureUploadStatus,
      },
    };
  }

  async getAll(query: QueryUserDto) {
    const { page, limit, skip, take } = this.getPagination(
      query.page,
      query.limit,
    );

    const where: Prisma.UtilisateurWhereInput = {};
    const AND: Prisma.UtilisateurWhereInput[] = [];

    if (query.search?.trim()) {
      const search = query.search.trim();
      const searchUpper = search.toLocaleUpperCase('fr-FR');
      const typeValues = Object.values(TypeUtilisateur) as string[];

      const OR: Prisma.UtilisateurWhereInput[] = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];

      if (typeValues.includes(searchUpper)) {
        OR.push({
          type: searchUpper as TypeUtilisateur,
        });
      }

      AND.push({ OR });
    }

    if (query.firstName?.trim()) {
      AND.push({
        firstName: { contains: query.firstName.trim(), mode: 'insensitive' },
      });
    }

    if (query.lastName?.trim()) {
      AND.push({
        lastName: { contains: query.lastName.trim(), mode: 'insensitive' },
      });
    }

    if (query.email?.trim()) {
      AND.push({
        email: { contains: query.email.trim(), mode: 'insensitive' },
      });
    }

    if (query.phone?.trim()) {
      AND.push({
        phone: { contains: query.phone.trim() },
      });
    }

    if (query.type) {
      AND.push({ type: query.type });
    }

    if (query.regionId) {
      AND.push({ regionId: query.regionId });
    }

    if (query.departementId) {
      AND.push({ departementId: query.departementId });
    }

    if (query.groupeId) {
      AND.push({ groupeId: query.groupeId });
    }

    if (query.zoneId) {
      AND.push({ zoneId: query.zoneId });
    }

    if (query.isBlock !== undefined) {
      AND.push({ isBlock: query.isBlock });
    }

    if (query.isVerified !== undefined) {
      AND.push({ isVerified: query.isVerified });
    }

    if (query.isDeleted !== undefined) {
      AND.push({ isDeleted: query.isDeleted });
    } else {
      AND.push({ isDeleted: false });
    }

    if (query.createdFrom || query.createdTo) {
      AND.push({
        createdAt: {
          ...(query.createdFrom
            ? { gte: new Date(`${query.createdFrom}T00:00:00.000Z`) }
            : {}),
          ...(query.createdTo
            ? { lte: new Date(`${query.createdTo}T23:59:59.999Z`) }
            : {}),
        },
      });
    }

    if (AND.length) {
      where.AND = AND;
    }

    const [total, users] = await Promise.all([
      this.prisma.utilisateur.count({ where }),
      this.prisma.utilisateur.findMany({
        where,
        skip,
        take,
        orderBy: { id: 'desc' },
        include: this.getUserInclude(),
      }),
    ]);

    return {
      message: 'Liste des utilisateurs récupérée avec succès.',
      messageE: 'Users fetched successfully.',
      data: users.map((user) => this.mapUser(user)),
      meta: this.buildMeta(page, limit, total),
    };
  }

  async getOne(id: number) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id },
      include: this.getUserInclude(),
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException({
        message: 'Utilisateur introuvable.',
        messageE: 'User not found.',
      });
    }

    return {
      message: 'Utilisateur récupéré avec succès.',
      messageE: 'User fetched successfully.',
      data: this.mapUser(user),
    };
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    pictureFile?: Express.Multer.File,
  ) {
    const existing = await this.prisma.utilisateur.findUnique({
      where: { id },
      include: this.getUserInclude(),
    });

    if (!existing || existing.isDeleted) {
      throw new NotFoundException({
        message: 'Utilisateur introuvable.',
        messageE: 'User not found.',
      });
    }

    const email = dto.email ? this.normalizeEmail(dto.email) : undefined;
    const phone = dto.phone ? this.normalizePhone(dto.phone) : undefined;

    if (email || phone) {
      await this.ensureUniqueEmailAndPhone(
        email || existing.email,
        phone || existing.phone,
        id,
      );
    }

    await this.validateGeographie({
      regionId: dto.regionId ?? existing.regionId,
      departementId: dto.departementId ?? existing.departementId,
      groupeId: dto.groupeId ?? existing.groupeId,
      zoneId: dto.zoneId ?? existing.zoneId,
    });

    const picturePreparation = this.preparePictureForUpdate(
      dto.picture,
      pictureFile,
    );

    const data: Prisma.UtilisateurUpdateInput = {};

    if (dto.firstName !== undefined) {
      data.firstName = this.normalizeText(dto.firstName);
    }

    if (dto.lastName !== undefined) {
      data.lastName = this.normalizeText(dto.lastName);
    }

    if (email !== undefined) {
      data.email = email;
    }

    if (phone !== undefined) {
      data.phone = phone;
    }

    if (dto.password !== undefined && dto.password.trim()) {
      data.password = await bcrypt.hash(dto.password, 10);
      data.loginAttempt = 0;
    }

    if (dto.type !== undefined) {
      data.type = dto.type;
    }

    if (picturePreparation.immediatePictureUrl !== undefined) {
      data.picture = picturePreparation.immediatePictureUrl;
    }

    if (dto.regionId !== undefined) {
      data.region = dto.regionId
        ? { connect: { id: dto.regionId } }
        : { disconnect: true };
    }

    if (dto.departementId !== undefined) {
      data.departement = dto.departementId
        ? { connect: { id: dto.departementId } }
        : { disconnect: true };
    }

    if (dto.groupeId !== undefined) {
      data.groupe = dto.groupeId
        ? { connect: { id: dto.groupeId } }
        : { disconnect: true };
    }

    if (dto.zoneId !== undefined) {
      data.zone = dto.zoneId
        ? { connect: { id: dto.zoneId } }
        : { disconnect: true };
    }

    const hasDataToUpdate = Object.keys(data).length > 0;

    const user = hasDataToUpdate
      ? await this.prisma.utilisateur.update({
          where: { id },
          data,
          include: this.getUserInclude(),
        })
      : await this.prisma.utilisateur.findUnique({
          where: { id },
          include: this.getUserInclude(),
        });

    if (picturePreparation.backgroundPictureInput) {
      this.startPictureUploadInBackground(
        id,
        picturePreparation.backgroundPictureInput as string | Express.Multer.File,
      );
    }

    return {
      message: 'Utilisateur mis à jour avec succès.',
      messageE: 'User updated successfully.',
      data: {
        ...this.mapUser(user),
        pictureUploadStatus: picturePreparation.pictureUploadStatus,
      },
    };
  }

  async block(id: number) {
    const existing = await this.prisma.utilisateur.findUnique({
      where: { id },
      select: { id: true, isDeleted: true },
    });

    if (!existing || existing.isDeleted) {
      throw new NotFoundException({
        message: 'Utilisateur introuvable.',
        messageE: 'User not found.',
      });
    }

    const user = await this.prisma.utilisateur.update({
      where: { id },
      data: { isBlock: true },
      include: this.getUserInclude(),
    });

    return {
      message: 'Utilisateur bloqué avec succès.',
      messageE: 'User blocked successfully.',
      data: this.mapUser(user),
    };
  }

  async unblock(id: number) {
    const existing = await this.prisma.utilisateur.findUnique({
      where: { id },
      select: { id: true, isDeleted: true },
    });

    if (!existing || existing.isDeleted) {
      throw new NotFoundException({
        message: 'Utilisateur introuvable.',
        messageE: 'User not found.',
      });
    }

    const user = await this.prisma.utilisateur.update({
      where: { id },
      data: {
        isBlock: false,
        loginAttempt: 0,
      },
      include: this.getUserInclude(),
    });

    return {
      message: 'Utilisateur débloqué avec succès.',
      messageE: 'User unblocked successfully.',
      data: this.mapUser(user),
    };
  }
}