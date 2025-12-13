// import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { CreateArrondissementDto } from './dto/create-arrondissement.dto';
// import { UpdateArrondissementDto } from './dto/update-arrondissement.dto';

// @Injectable()
// export class ArrondissementsService {
//   constructor(private readonly prisma: PrismaService) {}

//   async list(params: { page: number; pageSize: number; sort?: Record<string,'asc'|'desc'>; q?: string; departementId?: number; code?: string; }) {
//     const { page, pageSize, sort, q, departementId, code } = params;
//     const where: any = {};
//     if (q) {
//       where.OR = [
//         { nom:    { contains: q, mode: 'insensitive' } },
//         { nom_en: { contains: q, mode: 'insensitive' } },
//         { code:   { contains: q, mode: 'insensitive' } },
//       ];
//     }
//     if (typeof departementId === 'number') where.departementId = departementId;
//     if (code) where.code = code;

//     const [total, items] = await this.prisma.$transaction([
//       this.prisma.arrondissement.count({ where }),
//       this.prisma.arrondissement.findMany({
//         where,
//         orderBy: sort ?? { nom: 'asc' },
//         skip: (page - 1) * pageSize,
//         take: pageSize,
//         select: {
//           id: true, nom: true, nom_en: true, code: true, departementId: true,
//           departement: { select: { id: true, nom: true, code: true, regionId: true } },
//         },
//       }),
//     ]);
//     return { total, items };
//   }

//   async create(dto: CreateArrondissementDto) {
//     await this.ensureDepartement(dto.departementId);
//     try {
//       return await this.prisma.arrondissement.create({
//         data: { nom: dto.nom, nom_en: dto.nom_en, code: dto.code, departementId: dto.departementId },
//         select: { id: true, nom: true, nom_en: true, code: true, departementId: true },
//       });
//     } catch (e: any) {
//       if (e.code === 'P2002')
//         throw new BadRequestException({ message: 'Contrainte d’unicité (code).', messageE: 'Unique constraint (code).' });
//       throw e;
//     }
//   }

//   async findOne(id: number) {
//     const row = await this.prisma.arrondissement.findUnique({
//       where: { id },
//       select: { id: true, nom: true, nom_en: true, code: true, departementId: true },
//     });
//     if (!row)
//       throw new NotFoundException({ message: 'Arrondissement introuvable.', messageE: 'Sub-division not found.' });
//     return row;
//   }

//   async update(id: number, dto: UpdateArrondissementDto) {
//     await this.ensureExists(id);
//     if (typeof dto.departementId === 'number') await this.ensureDepartement(dto.departementId);
//     try {
//       return await this.prisma.arrondissement.update({
//         where: { id }, data: dto,
//         select: { id: true, nom: true, nom_en: true, code: true, departementId: true },
//       });
//     } catch (e: any) {
//       if (e.code === 'P2002')
//         throw new BadRequestException({ message: 'Contrainte d’unicité (code).', messageE: 'Unique constraint (code).' });
//       throw e;
//     }
//   }

//   private async ensureExists(id: number) {
//     const ok = await this.prisma.arrondissement.count({ where: { id } });
//     if (!ok)
//       throw new NotFoundException({ message: 'Arrondissement introuvable.', messageE: 'Sub-division not found.' });
//   }
//   private async ensureDepartement(id: number) {
//     const ok = await this.prisma.departement.count({ where: { id } });
//     if (!ok)
//       throw new BadRequestException({ message: 'Département inconnu.', messageE: 'Unknown department.' });
//   }
// }
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArrondissementDto } from './dto/create-arrondissement.dto';
import { UpdateArrondissementDto } from './dto/update-arrondissement.dto';

@Injectable()
export class ArrondissementsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { page: number; pageSize: number; sort?: Record<string,'asc'|'desc'>; q?: string; departementId?: number; code?: string; }) {
    const { page, pageSize, sort, q, departementId, code } = params;
    const where: any = {};
    if (q) {
      where.OR = [
        { nom:    { contains: q, mode: 'insensitive' } },
        { nom_en: { contains: q, mode: 'insensitive' } },
        { code:   { contains: q, mode: 'insensitive' } },
      ];
    }
    if (typeof departementId === 'number') where.departementId = departementId;
    if (code) where.code = code;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.arrondissement.count({ where }),
      this.prisma.arrondissement.findMany({
        where,
        orderBy: sort ?? { nom: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, nom: true, nom_en: true, code: true, departementId: true,
          departement: { select: { id: true, nom: true, code: true, regionId: true } },
        },
      }),
    ]);
    return { total, items };
  }

  // async create(dto: CreateArrondissementDto) {
  //   await this.ensureDepartement(dto.departementId);
  //   try {
  //     return await this.prisma.arrondissement.create({
  //       data: { nom: dto.nom, nom_en: dto.nom_en, code: dto.code, departementId: dto.departementId },
  //       select: { id: true, nom: true, nom_en: true, code: true, departementId: true },
  //     });
  //   } catch (e: any) {
  //     if (e.code === 'P2002')
  //       throw new BadRequestException({ message: 'Contrainte d’unicité (code).', messageE: 'Unique constraint (code).' });
  //     throw e;
  //   }
  // }

  async create(dto: CreateArrondissementDto) {
  await this.ensureDepartement(dto.departementId);

  const createCall = () =>
    this.prisma.arrondissement.create({
      data: { nom: dto.nom, nom_en: dto.nom_en, code: dto.code, departementId: dto.departementId },
      select: { id: true, nom: true, nom_en: true, code: true, departementId: true },
    });

  try {
    return await createCall();
  } catch (e: any) {
    if (e.code === 'P2002') {
      const tgt = Array.isArray(e.meta?.target) ? e.meta.target.join(',') : String(e.meta?.target ?? '');
      if (tgt.includes('id')) {
        await this.prisma.$executeRaw`
          SELECT setval(
            pg_get_serial_sequence('"Arrondissement"', 'id'),
            (SELECT COALESCE(MAX(id), 0) + 1 FROM "Arrondissement"),
            false
          );
        `;
        return await createCall();
      }
      throw new BadRequestException({ message: 'Contrainte d’unicité (code).', messageE: 'Unique constraint (code).' });
    }
    throw e;
  }
}


  async findOne(id: number) {
    const row = await this.prisma.arrondissement.findUnique({
      where: { id },
      select: { id: true, nom: true, nom_en: true, code: true, departementId: true },
    });
    if (!row)
      throw new NotFoundException({ message: 'Arrondissement introuvable.', messageE: 'Sub-division not found.' });
    return row;
  }

  async update(id: number, dto: UpdateArrondissementDto) {
    await this.ensureExists(id);
    if (typeof dto.departementId === 'number') await this.ensureDepartement(dto.departementId);
    try {
      return await this.prisma.arrondissement.update({
        where: { id }, data: dto,
        select: { id: true, nom: true, nom_en: true, code: true, departementId: true },
      });
    } catch (e: any) {
      if (e.code === 'P2002')
        throw new BadRequestException({ message: 'Contrainte d’unicité (code).', messageE: 'Unique constraint (code).' });
      throw e;
    }
  }

  private async ensureExists(id: number) {
    const ok = await this.prisma.arrondissement.count({ where: { id } });
    if (!ok)
      throw new NotFoundException({ message: 'Arrondissement introuvable.', messageE: 'Sub-division not found.' });
  }
  private async ensureDepartement(id: number) {
    const ok = await this.prisma.departement.count({ where: { id } });
    if (!ok)
      throw new BadRequestException({ message: 'Département inconnu.', messageE: 'Unknown department.' });
  }
}
