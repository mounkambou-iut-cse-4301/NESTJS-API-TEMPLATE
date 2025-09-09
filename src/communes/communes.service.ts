// import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { CreateCommuneDto } from './dto/create-commune.dto';
// import { UpdateCommuneDto } from './dto/update-commune.dto';

// // Typage fort de la ligne renvoyée par groupBy() pour éviter les erreurs TS sur _count
// type RoleGroupRow = { roleId: number; _count: { _all: number } };

// @Injectable()
// export class CommunesService {
//   constructor(private readonly prisma: PrismaService) {}

//   async list(params: {
//     page: number;
//     pageSize: number;
//     sort?: Record<string, 'asc' | 'desc'>;
//     q?: string;
//     arrondissementId?: number;
//     departementId?: number;
//     regionId?: number;
//     code?: string;
//     is_verified?: boolean;
//     is_block?: boolean;
//     typeCommuneId?: number;
//     req?: any; // pour le logging / scoping
//   }) {
//     const {
//       page,
//       pageSize,
//       sort,
//       q,
//       arrondissementId,
//       departementId,
//       regionId,
//       code,
//       is_verified,
//       is_block,
//       typeCommuneId,
//       req,
//     } = params;

//     const currentUserId = req?.sub as number | undefined;
//     const userCommuneId = req?.user?.communeId as number | undefined;

//     const where: any = {};
//     if (q) {
//       where.OR = [
//         { nom: { contains: q, mode: 'insensitive' } },
//         { nom_en: { contains: q, mode: 'insensitive' } },
//         { code: { contains: q, mode: 'insensitive' } },
//       ];
//     }
//     if (typeof arrondissementId === 'number') where.arrondissementId = arrondissementId;
//     if (typeof departementId === 'number') where.departementId = departementId; // 👈 nouveau
//     if (typeof regionId === 'number') where.regionId = regionId;               // 👈 nouveau
//     if (typeof typeCommuneId === 'number') where.typeCommuneId = typeCommuneId;
//     if (code) where.code = code;
//     if (typeof is_verified === 'boolean') where.is_verified = is_verified;
//     if (typeof is_block === 'boolean') where.is_block = is_block;

//     // Scoping par commune de l'utilisateur connecté (prioritaire)
//     if (currentUserId && userCommuneId) {
//       where.id = userCommuneId;
//     }

//     const [total, rows] = await this.prisma.$transaction([
//       this.prisma.commune.count({ where }),
//       this.prisma.commune.findMany({
//         where,
//         orderBy: sort ?? { nom: 'asc' },
//         skip: (page - 1) * pageSize,
//         take: pageSize,
//         select: {
//           id: true,
//           nom: true,
//           nom_en: true,
//           longitude: true,
//           latitude: true,
//           code: true,
//           arrondissementId: true,
//           departementId: true,
//           regionId: true,
//           is_verified: true,
//           is_block: true,
//           arrondissement: { select: { id: true, nom: true, departementId: true } },
//           departement: { select: { id: true, nom: true, regionId: true } }, // utile côté UI
//           region: { select: { id: true, nom: true } },                      // utile côté UI
//           typeCommune: true,
//           _count: {
//             select: {
//               infrastructures: true,
//               utilisateurs: true,
//             },
//           },
//         },
//       }),
//     ]);

//     const items = rows.map((r: any) => ({
//       ...r,
//       infrastructures_count: r?._count?.infrastructures ?? 0,
//       utilisateurs_count: r?._count?.utilisateurs ?? 0,
//       _count: undefined,
//     }));

//     return { total, items };
//   }

//   async create(dto: CreateCommuneDto) {
//     const arr = await this.prisma.arrondissement.findUnique({
//       where: { id: dto.arrondissementId },
//       select: {
//         id: true,
//         departementId: true,
//         departement: { select: { regionId: true } },
//       },
//     });
//     if (!arr) {
//       throw new BadRequestException({
//         message: 'Arrondissement inconnu.',
//         messageE: 'Unknown sub-division.',
//       });
//     }

//     try {
//       const created = await this.prisma.commune.create({
//         data: {
//           nom: dto.nom,
//           nom_en: dto.nom_en,
//           nom_maire: dto.nom_maire,
//           longitude: dto.longitude,
//           latitude: dto.latitude,
//           code: dto.code,
//           typeCommuneId: dto.typeCommuneId ?? null,
//           arrondissementId: arr.id,
//           departementId: arr.departementId,
//           regionId: arr.departement.regionId,
//           is_verified: dto.is_verified ?? false,
//           is_block: dto.is_block ?? false,
//         },
//         select: {
//           id: true,
//           nom: true,
//           nom_en: true,
//           nom_maire: true,
//           longitude: true,
//           latitude: true,
//           code: true,
//           arrondissementId: true,
//           departementId: true,
//           typeCommune: true,
//           regionId: true,
//           is_verified: true,
//           is_block: true,
//         },
//       });
//       return created;
//     } catch (e: any) {
//       if (e.code === 'P2002') {
//         throw new BadRequestException({
//           message: 'Contrainte d’unicité (code).',
//           messageE: 'Unique constraint (code).',
//         });
//       }
//       throw e;
//     }
//   }

//   async findOne(id: number) {
//     const commune = await this.prisma.commune.findUnique({
//       where: { id },
//       select: {
//         id: true,
//         nom: true,
//         nom_en: true,
//         code: true,
//         latitude: true,
//         longitude: true,
//         arrondissementId: true,
//         arrondissement: true,
//         departementId: true,
//         departement: true,
//         regionId: true,
//         region: true,
//         typeCommuneId: true,
//         typeCommune: true,
//         is_verified: true,
//         is_block: true,
//       },
//     });

//     if (!commune) {
//       throw new NotFoundException({
//         message: 'Commune introuvable.',
//         messageE: 'Municipality not found.',
//       });
//     }

//     const [infraCount, grouped] = await this.prisma.$transaction([
//       this.prisma.infrastructure.count({ where: { communeId: id } }),
//       this.prisma.utilisateurRole.groupBy({
//         by: ['roleId'],
//         where: { user: { communeId: id } },
//         orderBy: { roleId: 'asc' },
//         _count: { _all: true },
//       }),
//     ]);

//     const groupedRoles = grouped as RoleGroupRow[];

//     const roleIds = groupedRoles.map((g) => g.roleId);
//     const roles = roleIds.length
//       ? await this.prisma.role.findMany({
//           where: { id: { in: roleIds } },
//           select: { id: true, nom: true },
//         })
//       : [];
//     const roleNameById = new Map(roles.map((r) => [r.id, r.nom]));

//     const users_by_role = groupedRoles.map((gr) => ({
//       roleId: gr.roleId,
//       role: roleNameById.get(gr.roleId) ?? 'INCONNU',
//       count: gr._count._all,
//     }));
//     const totalUsers = users_by_role.reduce((acc, r) => acc + r.count, 0);

//     return {
//       message: 'Synthèse commune.',
//       messageE: 'Municipality summary.',
//       data: {
//         commune,
//         totals: {
//           infrastructures: infraCount,
//           users: totalUsers,
//         },
//         users_by_role,
//       },
//     };
//   }

//   async infrasLastMonths(communeId: number, months = 12) {
//     const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
//     months = clamp(Number(months || 12), 1, 24);

//     const now = new Date();
//     const start = new Date(Date.UTC(
//       now.getUTCFullYear(),
//       now.getUTCMonth() - (months - 1),
//       1, 0, 0, 0, 0,
//     ));

//     const rows = await this.prisma.$queryRaw<Array<{ ym: string; c: bigint | number }>>`
//       SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS c
//       FROM Infrastructure
//       WHERE communeId = ${communeId} AND created_at >= ${start}
//       GROUP BY ym
//       ORDER BY ym ASC
//     `;

//     const map = new Map<string, number>();
//     for (const r of rows) {
//       const key = String(r.ym);
//       const val = typeof r.c === 'bigint' ? Number(r.c) : Number(r.c ?? 0);
//       map.set(key, val);
//     }

//     const out: Array<{ month: string; count: number }> = [];
//     let y = start.getUTCFullYear();
//     let m = start.getUTCMonth();
//     for (let i = 0; i < months; i++) {
//       const ym = `${y}-${String(m + 1).padStart(2, '0')}`;
//       out.push({ month: ym, count: map.get(ym) ?? 0 });
//       m++;
//       if (m > 11) { m = 0; y++; }
//     }

//     return {
//       communeId,
//       from: out[0]?.month,
//       to: out[out.length - 1]?.month,
//       items: out,
//       total_on_period: out.reduce((s, x) => s + x.count, 0),
//     };
//   }

//   async update(id: number, dto: UpdateCommuneDto) {
//     await this.ensureExists(id);

//     const data: any = {
//       nom: dto.nom,
//       nom_en: dto.nom_en,
//       nom_maire: dto.nom_maire,
//       typeCommuneId: dto.typeCommuneId,
//       longitude: dto.longitude,
//       latitude: dto.latitude,
//       code: dto.code,
//       is_verified: dto.is_verified,
//       is_block: dto.is_block,
//     };

//     if (typeof dto.arrondissementId === 'number') {
//       const arr = await this.prisma.arrondissement.findUnique({
//         where: { id: dto.arrondissementId },
//         select: {
//           id: true,
//           departementId: true,
//           departement: { select: { regionId: true } },
//         },
//       });
//       if (!arr) {
//         throw new BadRequestException({
//           message: 'Arrondissement inconnu.',
//           messageE: 'Unknown sub-division.',
//         });
//       }
//       data.arrondissementId = arr.id;
//       data.departementId = arr.departementId;
//       data.regionId = arr.departement.regionId;
//     }

//     if (typeof dto.typeCommuneId === 'number') {
//       const typeCommune = await this.prisma.typeCommune.findUnique({
//         where: { id: dto.typeCommuneId },
//       });
//       if (!typeCommune) {
//         throw new BadRequestException({
//           message: 'Type de commune inconnu.',
//           messageE: 'Unknown municipality type.',
//         });
//       }
//       data.typeCommuneId = typeCommune.id;
//     }

//     try {
//       const updated = await this.prisma.commune.update({
//         where: { id },
//         data,
//         select: {
//           id: true,
//           nom: true,
//           nom_en: true,
//           nom_maire: true,
//           longitude: true,
//           latitude: true,
//           code: true,
//           arrondissementId: true,
//           departementId: true,
//           typeCommuneId: true,
//           regionId: true,
//           is_verified: true,
//           is_block: true,
//         },
//       });
//       return updated;
//     } catch (e: any) {
//       if (e.code === 'P2002') {
//         throw new BadRequestException({
//           message: 'Contrainte d’unicité (code).',
//           messageE: 'Unique constraint (code).',
//         });
//       }
//       throw e;
//     }
//   }

//   private async ensureExists(id: number) {
//     const ok = await this.prisma.commune.count({ where: { id } });
//     if (!ok) {
//       throw new NotFoundException({
//         message: 'Commune introuvable.',
//         messageE: 'Municipality not found.',
//       });
//     }
//   }

//   async toggleBlock(id: number) {
//     const current = await this.prisma.commune.findUnique({
//       where: { id },
//       select: { id: true, nom: true, is_block: true },
//     });
//     if (!current) {
//       throw new NotFoundException({
//         message: 'Commune introuvable.',
//         messageE: 'Municipality not found.',
//       });
//     }

//     const updated = await this.prisma.commune.update({
//       where: { id },
//       data: { is_block: !current.is_block },
//       select: {
//         id: true,
//         nom: true,
//         is_block: true,
//         updated_at: true,
//       },
//     });

//     return updated;
//   }
// }
// src/communes/communes.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommuneDto } from './dto/create-commune.dto';
import { UpdateCommuneDto } from './dto/update-commune.dto';

// Typage fort de la ligne renvoyée par groupBy() pour éviter les erreurs TS sur _count
type RoleGroupRow = { roleId: number; _count: { _all: number } };
// 👇 util facultatif en haut du service (ou inline si tu préfères)
const toNullable = (v: unknown) =>
  typeof v === 'string' ? (v.trim() || null) : v == null ? null : String(v);

@Injectable()
export class CommunesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    page: number;
    pageSize: number;
    sort?: Record<string, 'asc' | 'desc'>;
    q?: string;
    arrondissementId?: number;
    departementId?: number;
    regionId?: number;
    code?: string;
    is_verified?: boolean;
    is_block?: boolean;
    typeCommuneId?: number;
    req?: any; // pour le logging / scoping
  }) {
    const {
      page,
      pageSize,
      sort,
      q,
      arrondissementId,
      departementId,
      regionId,
      code,
      is_verified,
      is_block,
      typeCommuneId,
      req,
    } = params;

    const currentUserId = req?.sub as number | undefined;
    const userCommuneId = req?.user?.communeId as number | undefined;

    const where: any = {};
    if (q) {
      where.OR = [
        { nom: { contains: q, mode: 'insensitive' } },
        { nom_en: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (typeof arrondissementId === 'number') where.arrondissementId = arrondissementId;
    if (typeof departementId === 'number') where.departementId = departementId;
    if (typeof regionId === 'number') where.regionId = regionId;
    if (typeof typeCommuneId === 'number') where.typeCommuneId = typeCommuneId;
    if (code) where.code = code;
    if (typeof is_verified === 'boolean') where.is_verified = is_verified;
    if (typeof is_block === 'boolean') where.is_block = is_block;

    // Scoping par commune de l'utilisateur connecté (prioritaire)
    if (currentUserId && userCommuneId) {
      where.id = userCommuneId;
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.commune.count({ where }),
      this.prisma.commune.findMany({
        where,
        orderBy: sort ?? { nom: 'asc' },
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
          departement: { select: { id: true, nom: true, regionId: true } }, // utile côté UI
          region: { select: { id: true, nom: true } },                      // utile côté UI
          typeCommune: true,
          _count: {
            select: {
              infrastructures: true,
              utilisateurs: true,
            },
          },
        },
      }),
    ]);

    const items = rows.map((r: any) => ({
      ...r,
      infrastructures_count: r?._count?.infrastructures ?? 0,
      utilisateurs_count: r?._count?.utilisateurs ?? 0,
      _count: undefined,
    }));

    return { total, items };
  }

  // async create(dto: CreateCommuneDto) {
  //   const arr = await this.prisma.arrondissement.findUnique({
  //     where: { id: dto.arrondissementId },
  //     select: {
  //       id: true,
  //       departementId: true,
  //       departement: { select: { regionId: true } },
  //     },
  //   });
  //   if (!arr) {
  //     throw new BadRequestException({
  //       message: 'Arrondissement inconnu.',
  //       messageE: 'Unknown sub-division.',
  //     });
  //   }

  //   try {
  //     const created = await this.prisma.commune.create({
  //       data: {
  //         nom: dto.nom,
  //         nom_en: dto.nom_en,
  //         nom_maire: dto.nom_maire,
  //         longitude: dto.longitude,
  //         latitude: dto.latitude,
  //         code: dto.code,
  //         typeCommuneId: dto.typeCommuneId ?? null,
  //         arrondissementId: arr.id,
  //         departementId: arr.departementId,
  //         regionId: arr.departement.regionId,
  //         is_verified: dto.is_verified ?? false,
  //         is_block: dto.is_block ?? false,
  //       },
  //       select: {
  //         id: true,
  //         nom: true,
  //         nom_en: true,
  //         nom_maire: true,
  //         longitude: true,
  //         latitude: true,
  //         code: true,
  //         arrondissementId: true,
  //         departementId: true,
  //         typeCommune: true,
  //         regionId: true,
  //         is_verified: true,
  //         is_block: true,
  //       },
  //     });
  //     return created;
  //   } catch (e: any) {
  //     if (e.code === 'P2002') {
  //       throw new BadRequestException({
  //         message: 'Contrainte d’unicité (code).',
  //         messageE: 'Unique constraint (code).',
  //       });
  //     }
  //     throw e;
  //   }
  // }
async create(dto: CreateCommuneDto) {
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

  try {
    const created = await this.prisma.commune.create({
      data: {
        nom: dto.nom,
        nom_en: dto.nom_en,
        nom_maire: dto.nom_maire,
        longitude: dto.longitude,
        latitude: dto.latitude,
        code: dto.code,
        communeUrl: toNullable(dto.communeUrl), // 👈 NEW
        typeCommuneId: dto.typeCommuneId ?? null,
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
        nom_maire: true,
        longitude: true,
        latitude: true,
        code: true,
        communeUrl: true,           // 👈 NEW
        arrondissementId: true,
        departementId: true,
        typeCommune: true,
        regionId: true,
        is_verified: true,
        is_block: true,
      },
    });
    return created;
  } catch (e: any) {
    if (e.code === 'P2002') {
      const tgt = Array.isArray(e.meta?.target)
        ? e.meta.target.join(',')
        : String(e.meta?.target ?? '');
      if (tgt.includes('communeUrl') || /communeurl/i.test(tgt)) {
        throw new BadRequestException({
          message: 'Contrainte d’unicité (communeUrl).',
          messageE: 'Unique constraint (communeUrl).',
        });
      }
      if (tgt.includes('code') || /code/i.test(tgt)) {
        throw new BadRequestException({
          message: 'Contrainte d’unicité (code).',
          messageE: 'Unique constraint (code).',
        });
      }
    }
    throw e;
  }
}

  async findOne(id: number) {
    const commune = await this.prisma.commune.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        nom_en: true,
        code: true,
        latitude: true,
        longitude: true,
        arrondissementId: true,
        arrondissement: true,
        departementId: true,
        departement: true,
        regionId: true,
        region: true,
        typeCommuneId: true,
        typeCommune: true,
        is_verified: true,
        is_block: true,
      },
    });

    if (!commune) {
      throw new NotFoundException({
        message: 'Commune introuvable.',
        messageE: 'Municipality not found.',
      });
    }

    const [infraCount, grouped] = await this.prisma.$transaction([
      this.prisma.infrastructure.count({ where: { communeId: id } }),
      this.prisma.utilisateurRole.groupBy({
        by: ['roleId'],
        where: { user: { communeId: id } },
        orderBy: { roleId: 'asc' },
        _count: { _all: true },
      }),
    ]);

    const groupedRoles = grouped as RoleGroupRow[];

    const roleIds = groupedRoles.map((g) => g.roleId);
    const roles = roleIds.length
      ? await this.prisma.role.findMany({
          where: { id: { in: roleIds } },
          select: { id: true, nom: true },
        })
      : [];
    const roleNameById = new Map(roles.map((r) => [r.id, r.nom]));

    const users_by_role = groupedRoles.map((gr) => ({
      roleId: gr.roleId,
      role: roleNameById.get(gr.roleId) ?? 'INCONNU',
      count: gr._count._all,
    }));
    const totalUsers = users_by_role.reduce((acc, r) => acc + r.count, 0);

    return {
      message: 'Synthèse commune.',
      messageE: 'Municipality summary.',
      data: {
        commune,
        totals: {
          infrastructures: infraCount,
          users: totalUsers,
        },
        users_by_role,
      },
    };
  }

  async infrasLastMonths(communeId: number, months = 12) {
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    months = clamp(Number(months || 12), 1, 24);

    const now = new Date();
    const start = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - (months - 1),
      1, 0, 0, 0, 0,
    ));

    // ✅ PostgreSQL: DATE_FORMAT -> to_char, quoting des identifiants
    const rows = await this.prisma.$queryRaw<Array<{ ym: string; c: bigint | number }>>`
      SELECT to_char("created_at", 'YYYY-MM') AS ym, COUNT(*) AS c
      FROM "Infrastructure"
      WHERE "communeId" = ${communeId} AND "created_at" >= ${start}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    const map = new Map<string, number>();
    for (const r of rows) {
      const key = String(r.ym);
      const val = typeof r.c === 'bigint' ? Number(r.c) : Number(r.c ?? 0);
      map.set(key, val);
    }

    const out: Array<{ month: string; count: number }> = [];
    let y = start.getUTCFullYear();
    let m = start.getUTCMonth();
    for (let i = 0; i < months; i++) {
      const ym = `${y}-${String(m + 1).padStart(2, '0')}`;
      out.push({ month: ym, count: map.get(ym) ?? 0 });
      m++;
      if (m > 11) { m = 0; y++; }
    }

    return {
      communeId,
      from: out[0]?.month,
      to: out[out.length - 1]?.month,
      items: out,
      total_on_period: out.reduce((s, x) => s + x.count, 0),
    };
  }

  // async update(id: number, dto: UpdateCommuneDto) {
  //   await this.ensureExists(id);

  //   const data: any = {
  //     nom: dto.nom,
  //     nom_en: dto.nom_en,
  //     nom_maire: dto.nom_maire,
  //     typeCommuneId: dto.typeCommuneId,
  //     longitude: dto.longitude,
  //     latitude: dto.latitude,
  //     code: dto.code,
  //     is_verified: dto.is_verified,
  //     is_block: dto.is_block,
  //   };

  //   if (typeof dto.arrondissementId === 'number') {
  //     const arr = await this.prisma.arrondissement.findUnique({
  //       where: { id: dto.arrondissementId },
  //       select: {
  //         id: true,
  //         departementId: true,
  //         departement: { select: { regionId: true } },
  //       },
  //     });
  //     if (!arr) {
  //       throw new BadRequestException({
  //         message: 'Arrondissement inconnu.',
  //         messageE: 'Unknown sub-division.',
  //       });
  //     }
  //     data.arrondissementId = arr.id;
  //     data.departementId = arr.departementId;
  //     data.regionId = arr.departement.regionId;
  //   }

  //   if (typeof dto.typeCommuneId === 'number') {
  //     const typeCommune = await this.prisma.typeCommune.findUnique({
  //       where: { id: dto.typeCommuneId },
  //     });
  //     if (!typeCommune) {
  //       throw new BadRequestException({
  //         message: 'Type de commune inconnu.',
  //         messageE: 'Unknown municipality type.',
  //       });
  //     }
  //     data.typeCommuneId = typeCommune.id;
  //   }

  //   try {
  //     const updated = await this.prisma.commune.update({
  //       where: { id },
  //       data,
  //       select: {
  //         id: true,
  //         nom: true,
  //         nom_en: true,
  //         nom_maire: true,
  //         longitude: true,
  //         latitude: true,
  //         code: true,
  //         arrondissementId: true,
  //         departementId: true,
  //         typeCommuneId: true,
  //         regionId: true,
  //         is_verified: true,
  //         is_block: true,
  //       },
  //     });
  //     return updated;
  //   } catch (e: any) {
  //     if (e.code === 'P2002') {
  //       throw new BadRequestException({
  //         message: 'Contrainte d’unicité (code).',
  //         messageE: 'Unique constraint (code).',
  //       });
  //     }
  //     throw e;
  //   }
  // }
async update(id: number, dto: UpdateCommuneDto) {
  await this.ensureExists(id);

  const data: any = {
    nom: dto.nom,
    nom_en: dto.nom_en,
    nom_maire: dto.nom_maire,
    typeCommuneId: dto.typeCommuneId,
    longitude: dto.longitude,
    latitude: dto.latitude,
    code: dto.code,
    // si non fourni => undefined (pas de modif), si chaîne vide => null (on efface)
    communeUrl: dto.communeUrl === undefined ? undefined : toNullable(dto.communeUrl), // 👈 NEW
    is_verified: dto.is_verified,
    is_block: dto.is_block,
  };

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
        nom_maire: true,
        longitude: true,
        latitude: true,
        code: true,
        communeUrl: true,           // 👈 NEW
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
      const tgt = Array.isArray(e.meta?.target)
        ? e.meta.target.join(',')
        : String(e.meta?.target ?? '');
      if (tgt.includes('communeUrl') || /communeurl/i.test(tgt)) {
        throw new BadRequestException({
          message: 'Contrainte d’unicité (communeUrl).',
          messageE: 'Unique constraint (communeUrl).',
        });
      }
      if (tgt.includes('code') || /code/i.test(tgt)) {
        throw new BadRequestException({
          message: 'Contrainte d’unicité (code).',
          messageE: 'Unique constraint (code).',
        });
      }
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
