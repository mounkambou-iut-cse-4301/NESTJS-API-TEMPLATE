// import { Injectable } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { CreateSettingDto } from './dto/create-setting.dto';
// import { UpdateSettingDto } from './dto/update-setting.dto';

// @Injectable()
// export class SettingsService {
//   constructor(private readonly prisma: PrismaService) {}

//   /** Retourne l’unique Setting, en le créant si nécessaire (id=1). */
//   async getOne() {
//     const existing = await this.prisma.setting.findFirst();
//     if (existing) return existing;
//     return this.prisma.setting.create({
//       data: { id: 1, centralServerUrl: null },
//     });
//   }

//   /** Create si rien n’existe, sinon update → upsert (toujours id=1). */
//   async createOrUpdate(dto: CreateSettingDto) {
//     return this.prisma.setting.upsert({
//       where: { id: 1 },
//       update: { centralServerUrl: dto.centralServerUrl ?? null },
//       create: { id: 1, centralServerUrl: dto.centralServerUrl ?? null },
//     });
//   }

//   /** Update de l’unique ligne (assure l’existence d’abord). */
//   async update(dto: UpdateSettingDto) {
//     await this.getOne(); // garantit la présence
//     return this.prisma.setting.update({
//       where: { id: 1 },
//       data: { centralServerUrl: dto.centralServerUrl ?? null },
//     });
//   }
// }
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Garantit l’existence de la ligne id=1 et la retourne. */
  async getOne() {
    const existing = await this.prisma.setting.findFirst();
    if (existing) return existing;
    return this.prisma.setting.create({
      data: { id: 1, centralServerUrl: null, maxActivatedCommunes: 10 },
    });
  }

  /** Upsert (id=1). */
  async createOrUpdate(dto: CreateSettingDto | UpdateSettingDto) {
    return this.prisma.setting.upsert({
      where: { id: 1 },
      update: {
        centralServerUrl: dto.centralServerUrl ?? null,
        // on ne touche pas maxActiveCommunes ici (API dédiée)
      },
      create: {
        id: 1,
        centralServerUrl: dto.centralServerUrl ?? null,
        maxActivatedCommunes: 10,
      },
    });
  }

  /** Update centralServerUrl (API historique) */
  async update(dto: UpdateSettingDto) {
    await this.getOne();
    return this.prisma.setting.update({
      where: { id: 1 },
      data: { centralServerUrl: dto.centralServerUrl ?? null },
    });
  }

  /** Met à jour uniquement le plafond. */
  async updateMaxActiveCommunes(maxActivatedCommunes: number) {
    await this.getOne();
    if (maxActivatedCommunes < 0) {
      throw new BadRequestException('maxActivatedCommunes must be >= 0');
    }
    return this.prisma.setting.update({
      where: { id: 1 },
      data: { maxActivatedCommunes },
    });
  }

  /** Retourne le total + une page des communes actives (is_verified=true). */
  async getActiveCommunesPaginated(page = 1, limit = 20) {
    await this.getOne();
    const skip = (page - 1) * limit;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.commune.count({ where: { is_verified: true } }),
      this.prisma.commune.findMany({
        where: { is_verified: true },
        skip,
        take: limit,
        orderBy: { id: 'asc' },
        select: {
          id: true,
          nom: true,
          nom_en: true,
          code: true,
          communeUrl: true,
          is_verified: true,
          region: { select: { id: true, nom: true, code: true } },
          departement: { select: { id: true, nom: true, code: true } },
          arrondissement: { select: { id: true, nom: true, code: true } },
        },
      }),
    ]);

    return { total, page, limit, data };
  }

  /**
   * Tente d’activer la commune (is_verified=true) de l’utilisateur,
   * tout en respectant le plafond global. Transaction en isolation "Serializable"
   * pour éviter les courses critiques lors d’activations concurrentes.
   */
  async activateUserCommuneIfAllowed(userId: number) {
    // Récupère l’utilisateur avec sa commune
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { id: true, communeId: true },
    });
    if (!user?.communeId) {
      return { activated: false, reason: 'no_commune_for_user' };
    }

    const result = await this.prisma.$transaction(
      async (tx) => {
        // Assure la présence du Setting
        const settings = await tx.setting.upsert({
          where: { id: 1 },
          update: {},
          create: { id: 1, centralServerUrl: null, maxActivatedCommunes: 10 },
        });

        // État actuel de la commune
        const commune = await tx.commune.findUnique({
          where: { id: user.communeId! },
          select: { id: true, is_verified: true },
        });
        if (!commune) return { activated: false, reason: 'commune_not_found' };

        if (commune.is_verified) {
          return { activated: true, reason: 'already_active' };
        }

        const totalActive = await tx.commune.count({
          where: { is_verified: true },
        });

        if (totalActive >= settings.maxActivatedCommunes) {
          return { activated: false, reason: 'activation_limit_reached' };
        }

        await tx.commune.update({
          where: { id: commune.id },
          data: { is_verified: true },
        });

        return { activated: true, reason: 'activated' };
      },
      { isolationLevel: 'Serializable' } // ← important pour Postgres
    );

    return result;
  }
}
