import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommuneDto } from './dto/create-commune.dto';
import { UpdateCommuneDto } from './dto/update-commune.dto';

@Injectable()
export class CommunesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    page: number; pageSize: number; sort?: Record<string,'asc'|'desc'>;
    q?: string; arrondissementId?: number; code?: string; is_verified?: boolean; is_block?: boolean;
    req?: any; // pour le logging
  }) {
    const { page, pageSize, sort, q, arrondissementId, code, is_verified, is_block, req } = params;
    const currentUserId = req?.sub as number | undefined;
    const userCommuneId = req?.user?.communeId as number | undefined;
    console.log(userCommuneId, currentUserId);

    const where: any = {};
    if (q) {
      where.OR = [
        { nom:    { contains: q, mode: 'insensitive' } },
        { nom_en: { contains: q, mode: 'insensitive' } },
        { code:   { contains: q, mode: 'insensitive' } },
      ];
    }
    if (typeof arrondissementId === 'number') where.arrondissementId = arrondissementId;
    if (code) where.code = code;
    if (typeof is_verified === 'boolean') where.is_verified = is_verified;
    if (typeof is_block === 'boolean') where.is_block = is_block;
    if (currentUserId && userCommuneId) {
        console.log(userCommuneId);
        
      // Si l'utilisateur est connecté et a une commune associée, on filtre par cette commune
      where.id = userCommuneId;
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.commune.count({ where }),
      this.prisma.commune.findMany({
        where,
        orderBy: sort ?? { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          nom: true,
          nom_en: true,
          longitude: true,
          latitude: true,
          code: true,
          arrondissementId: true,
          departementId: true,   // ← présent dans ton schéma
          regionId: true,        // ← présent dans ton schéma
          is_verified: true,
          is_block: true,
          arrondissement: { select: { id: true, nom: true, departementId: true } },
        },
      }),
    ]);
    return { total, items };
  }

  async create(dto: CreateCommuneDto) {
    // 1) Vérifier l’arrondissement et remonter departementId + regionId
    const arr = await this.prisma.arrondissement.findUnique({
      where: { id: dto.arrondissementId },
      select: {
        id: true,
        departementId: true,
        departement: { select: { regionId: true } },
      },
    });
    if (!arr) {
      throw new BadRequestException({
        message: 'Arrondissement inconnu.',
        messageE: 'Unknown sub-division.',
      });
    }

    // 2) Créer en fournissant les 3 FK (UncheckedCreateInput satisfait)
    try {
      const created = await this.prisma.commune.create({
        data: {
          nom: dto.nom,
          nom_en: dto.nom_en,
            longitude: dto.longitude,
            latitude: dto.latitude,

          code: dto.code,
          arrondissementId: arr.id,
          departementId: arr.departementId,
          regionId: arr.departement.regionId,
          is_verified: dto.is_verified ?? false,
          is_block: dto.is_block ?? false,
        },
        select: {
          id: true,
          nom: true,
          nom_en: true,
          longitude: true,
          latitude: true,
          code: true,
          arrondissementId: true,
          departementId: true,
          regionId: true,
          is_verified: true,
          is_block: true,
        },
      });
      return created;
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new BadRequestException({
          message: 'Contrainte d’unicité (code).',
          messageE: 'Unique constraint (code).',
        });
      }
      throw e;
    }
  }

  async findOne(id: number) {
    const row = await this.prisma.commune.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        nom_en: true,
        longitude: true,
        latitude: true,
        code: true,
        arrondissementId: true,
        departementId: true,
        regionId: true,
        is_verified: true,
        is_block: true,
      },
    });
    if (!row) {
      throw new NotFoundException({
        message: 'Commune introuvable.',
        messageE: 'Municipality not found.',
      });
    }
    return row;
  }

  async update(id: number, dto: UpdateCommuneDto) {
    await this.ensureExists(id);

    const data: any = {
      nom: dto.nom,
      nom_en: dto.nom_en,
      longitude: dto.longitude,
      latitude: dto.latitude,
      code: dto.code,
      is_verified: dto.is_verified,
      is_block: dto.is_block,
    };

    // 3) Si l’arrondissement change → réaligner departementId & regionId
    if (typeof dto.arrondissementId === 'number') {
      const arr = await this.prisma.arrondissement.findUnique({
        where: { id: dto.arrondissementId },
        select: {
          id: true,
          departementId: true,
          departement: { select: { regionId: true } },
        },
      });
      if (!arr) {
        throw new BadRequestException({
          message: 'Arrondissement inconnu.',
          messageE: 'Unknown sub-division.',
        });
      }
      data.arrondissementId = arr.id;
      data.departementId = arr.departementId;
      data.regionId = arr.departement.regionId;
    }

    try {
      const updated = await this.prisma.commune.update({
        where: { id },
        data,
        select: {
          id: true,
          nom: true,
          nom_en: true,
          longitude: true,
          latitude: true,
          code: true,
          arrondissementId: true,
          departementId: true,
          regionId: true,
          is_verified: true,
          is_block: true,
        },
      });
      return updated;
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new BadRequestException({
          message: 'Contrainte d’unicité (code).',
          messageE: 'Unique constraint (code).',
        });
      }
      throw e;
    }
  }

  private async ensureExists(id: number) {
    const ok = await this.prisma.commune.count({ where: { id } });
    if (!ok) {
      throw new NotFoundException({
        message: 'Commune introuvable.',
        messageE: 'Municipality not found.',
      });
    }
  }
}
