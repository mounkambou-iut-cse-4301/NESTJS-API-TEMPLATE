import { TypeCommune } from './../../generated/prisma/index.d';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommuneDto } from './dto/create-commune.dto';
import { UpdateCommuneDto } from './dto/update-commune.dto';

@Injectable()
export class CommunesService {
  constructor(private readonly prisma: PrismaService) {}

  // async list(params: {
  //   page: number; pageSize: number; sort?: Record<string,'asc'|'desc'>;
  //   q?: string; arrondissementId?: number; code?: string; is_verified?: boolean; is_block?: boolean; typeCommuneId?: number;
  //   req?: any; // pour le logging
  // }) {
  //   const { page, pageSize, sort, q, arrondissementId, code, is_verified, is_block, typeCommuneId, req } = params;
  //   const currentUserId = req?.sub as number | undefined;
  //   const userCommuneId = req?.user?.communeId as number | undefined;

  //   const where: any = {};
  //   if (q) {
  //     where.OR = [
  //       { nom:    { contains: q, mode: 'insensitive' } },
  //       { nom_en: { contains: q, mode: 'insensitive' } },
  //       { code:   { contains: q, mode: 'insensitive' } },
  //     ];
  //   }
  //   if (typeof arrondissementId === 'number') where.arrondissementId = arrondissementId;
  //   if (typeof typeCommuneId === 'number') where.typeCommuneId = typeCommuneId; 
  //   if (code) where.code = code;
  //   if (typeof is_verified === 'boolean') where.is_verified = is_verified;
  //   if (typeof is_block === 'boolean') where.is_block = is_block;
  //   if (currentUserId && userCommuneId) {
        
  //     // Si l'utilisateur est connecté et a une commune associée, on filtre par cette commune
  //     where.id = userCommuneId;
  //   }

  //   const [total, items] = await this.prisma.$transaction([
  //     this.prisma.commune.count({ where }),
  //     this.prisma.commune.findMany({
  //       where,
  //       orderBy: sort ?? { id: 'desc' },
  //       skip: (page - 1) * pageSize,
  //       take: pageSize,
  //       select: {
  //         id: true,
  //         nom: true,
  //         nom_en: true,
  //         longitude: true,
  //         latitude: true,
  //         code: true,
  //         arrondissementId: true,
  //         departementId: true,   // ← présent dans ton schéma
  //         regionId: true,        // ← présent dans ton schéma
  //         is_verified: true,
  //         is_block: true,
  //         arrondissement: { select: { id: true, nom: true, departementId: true } },
  //         typeCommune: true,
  //       },
  //     }),
  //   ]);
  //   return { total, items };
  // }

  async list(params: {
  page: number; pageSize: number; sort?: Record<string,'asc'|'desc'>;
  q?: string; arrondissementId?: number; code?: string; is_verified?: boolean; is_block?: boolean; typeCommuneId?: number;
  req?: any; // pour le logging
}) {
  const { page, pageSize, sort, q, arrondissementId, code, is_verified, is_block, typeCommuneId, req } = params;
  const currentUserId = req?.sub as number | undefined;
  const userCommuneId = req?.user?.communeId as number | undefined;

  const where: any = {};
  if (q) {
    where.OR = [
      { nom:    { contains: q, mode: 'insensitive' } },
      { nom_en: { contains: q, mode: 'insensitive' } },
      { code:   { contains: q, mode: 'insensitive' } },
    ];
  }
  if (typeof arrondissementId === 'number') where.arrondissementId = arrondissementId;
  if (typeof typeCommuneId === 'number') where.typeCommuneId = typeCommuneId;
  if (code) where.code = code;
  if (typeof is_verified === 'boolean') where.is_verified = is_verified;
  if (typeof is_block === 'boolean') where.is_block = is_block;

  // Si l'utilisateur connecté a une commune associée → on restreint à cette commune
  if (currentUserId && userCommuneId) {
    where.id = userCommuneId;
  }

  const [total, rows] = await this.prisma.$transaction([
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
        departementId: true,
        regionId: true,
        is_verified: true,
        is_block: true,
        arrondissement: { select: { id: true, nom: true, departementId: true } },
        typeCommune: true, // ou { select: { id: true, name: true } }
        // Comptages liés
        _count: {
          select: {
            infrastructures: true,
            utilisateurs: true,
          },
        },
      },
    }),
  ]);

  // Aplatis les compteurs dans des champs lisibles
  const items = rows.map((r: any) => ({
    ...r,
    infrastructures_count: r?._count?.infrastructures ?? 0,
    utilisateurs_count: r?._count?.utilisateurs ?? 0,
    _count: undefined, // on peut l’omettre si tu préfères ne pas renvoyer _count brut
  }));

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
          nom_maire:dto.nom_maire,
            longitude: dto.longitude,
            latitude: dto.latitude,

          code: dto.code,
          typeCommuneId: dto.typeCommuneId??null,
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
          nom_maire:true,
          longitude: true,
          latitude: true,
          code: true,
          arrondissementId: true,
          departementId: true,
          typeCommune:true,
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

  // async findOne(id: number) {
  //   const row = await this.prisma.commune.findUnique({
  //     where: { id },
  //     select: {
  //       id: true,
  //       nom: true,
  //       nom_en: true,
  //       nom_maire:true,
  //       longitude: true,
  //       infrastructures:true,
  //       utilisateurs:true,
  //       latitude: true,
  //       code: true,
  //       arrondissementId: true,
  //       departementId: true,
  //       regionId: true,
  //       typeCommuneId: true,
  //       is_verified: true,
  //       is_block: true,
  //     },
  //   });
  //   if (!row) {
  //     throw new NotFoundException({
  //       message: 'Commune introuvable.',
  //       messageE: 'Municipality not found.',
  //     });
  //   }
  //   return row;
  // }
async findOne(id: number) {
  const row = await this.prisma.commune.findUnique({
    where: { id },
    select: {
      id: true,
      nom: true,
      nom_en: true,
      nom_maire: true,
      longitude: true,
      infrastructures: true,
      utilisateurs: true,
      latitude: true,
      code: true,
      arrondissementId: true,
      departementId: true,
      regionId: true,
      typeCommuneId: true,
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

  // Convert BigInt values to numbers or strings
  const serializedRow = JSON.parse(JSON.stringify(row, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));

  return serializedRow;
}
  async update(id: number, dto: UpdateCommuneDto) {
    await this.ensureExists(id);

    const data: any = {
      nom: dto.nom,
      nom_en: dto.nom_en,
      nom_maire:dto.nom_maire,
      typeCommuneId: dto.typeCommuneId,
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

    if (typeof dto.typeCommuneId === 'number') {
      const typeCommune = await this.prisma.typeCommune.findUnique({
        where: { id: dto.typeCommuneId },
      });
      if (!typeCommune) {
        throw new BadRequestException({
          message: 'Type de commune inconnu.',
          messageE: 'Unknown municipality type.',
        });
      }
      data.typeCommuneId = typeCommune.id;
    }

    try {
      const updated = await this.prisma.commune.update({
        where: { id },
        data,
        select: {
          id: true,
          nom: true,
          nom_en: true,
          nom_maire:true,
          longitude: true,
          latitude: true,
          code: true,
          arrondissementId: true,
          departementId: true,
          typeCommuneId: true,
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

  async toggleBlock(id: number) {
    // 1) Vérifie l’existence + récupère le statut actuel
    const current = await this.prisma.commune.findUnique({
      where: { id },
      select: { id: true, nom: true, is_block: true },
    });
    if (!current) {
      throw new NotFoundException({
        message: 'Commune introuvable.',
        messageE: 'Municipality not found.',
      });
    }

    // 2) Inverse le statut
    const updated = await this.prisma.commune.update({
      where: { id },
      data: { is_block: !current.is_block },
      select: {
        id: true,
        nom: true,
        is_block: true,
        updated_at: true,
      },
    });

    return updated;
  }
}
