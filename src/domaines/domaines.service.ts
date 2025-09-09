// import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';

// @Injectable()
// export class DomainesService {
//   constructor(private readonly prisma: PrismaService) {}

//   async list(params: { page: number; pageSize: number; sort?: Record<string,'asc'|'desc'>; q?: string; code?: string; }) {
//     const { page, pageSize, sort, q, code } = params;
//     const where: any = {};
//     if (q) {
//       where.OR = [
//         { nom:   { contains: q, mode: 'insensitive' } },
//         { nom_en:{ contains: q, mode: 'insensitive' } },
//         { code:  { contains: q, mode: 'insensitive' } },
//       ];
//     }
//     if (code) where.code = code;

//     const [total, items] = await this.prisma.$transaction([
//       this.prisma.domaine.count({ where }),
//       this.prisma.domaine.findMany({
//         where,
//         orderBy: sort ?? { nom: 'asc' },
//         skip: (page - 1) * pageSize,
//         take: pageSize,
//         select: { id: true, nom: true, nom_en: true, code: true, created_at: true, updated_at: true },
//       }),
//     ]);
//     return { total, items };
//   }

//   async create(data: { nom: string; nom_en?: string; code?: string; }) {
//     try {
//       return await this.prisma.domaine.create({
//         data,
//         select: { id: true, nom: true, nom_en: true, code: true },
//       });
//     } catch (e: any) {
//       if (e.code === 'P2002') {
//         throw new BadRequestException({ message: 'Nom déjà utilisé.', messageE: 'Name already in use.' });
//       }
//       throw e;
//     }
//   }

//   async findOne(id: number) {
//     const row = await this.prisma.domaine.findUnique({
//       where: { id },
//       select: { id: true, nom: true, nom_en: true, code: true, created_at: true, updated_at: true },
//     });
//     if (!row) throw new NotFoundException({ message: 'Domaine introuvable.', messageE: 'Domain not found.' });
//     return row;
//   }

//   async update(id: number, data: { nom?: string; nom_en?: string; code?: string; }) {
//     await this.ensureExists(id);
//     try {
//       return await this.prisma.domaine.update({
//         where: { id },
//         data,
//         select: { id: true, nom: true, nom_en: true, code: true, updated_at: true },
//       });
//     } catch (e: any) {
//       if (e.code === 'P2002') {
//         throw new BadRequestException({ message: 'Nom déjà utilisé.', messageE: 'Name already in use.' });
//       }
//       throw e;
//     }
//   }

//   async remove(id: number) {
//     // Interdit si référencé
//     const used = await this.prisma.$transaction([
//       this.prisma.typeInfrastructure.count({ where: { domaineId: id } }),
//       this.prisma.sousDomaine.count({ where: { domaineId: id } }),
//       this.prisma.infrastructure.count({ where: { domaineId: id } }),
//     ]);
//     const totalUsed = used.reduce((a,b)=>a+b,0);
//     if (totalUsed > 0) {
//       throw new BadRequestException({
//         message: 'Domaine référencé — suppression interdite.',
//         messageE: 'Domain referenced — deletion forbidden.',
//       });
//     }
//     await this.prisma.domaine.delete({ where: { id } });
//   }

//   private async ensureExists(id: number) {
//     const ok = await this.prisma.domaine.count({ where: { id } });
//     if (!ok) throw new NotFoundException({ message: 'Domaine introuvable.', messageE: 'Domain not found.' });
//   }
// }
// src/domaines/domaines.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DomainesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { page: number; pageSize: number; sort?: Record<string,'asc'|'desc'>; q?: string; code?: string; }) {
    const { page, pageSize, sort, q, code } = params;
    const where: any = {};
    if (q) {
      where.OR = [
        { nom:   { contains: q, mode: 'insensitive' } },
        { nom_en:{ contains: q, mode: 'insensitive' } },
        { code:  { contains: q, mode: 'insensitive' } },
      ];
    }
    if (code) where.code = code;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.domaine.count({ where }),
      this.prisma.domaine.findMany({
        where,
        orderBy: sort ?? { nom: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, nom: true, nom_en: true, code: true, created_at: true, updated_at: true },
      }),
    ]);
    return { total, items };
  }

  async create(data: { nom: string; nom_en?: string; code?: string; }) {
    try {
      return await this.prisma.domaine.create({
        data,
        select: { id: true, nom: true, nom_en: true, code: true },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new BadRequestException({ message: 'Nom déjà utilisé.', messageE: 'Name already in use.' });
      }
      throw e;
    }
  }

  async findOne(id: number) {
    const row = await this.prisma.domaine.findUnique({
      where: { id },
      select: { id: true, nom: true, nom_en: true, code: true, created_at: true, updated_at: true },
    });
    if (!row) throw new NotFoundException({ message: 'Domaine introuvable.', messageE: 'Domain not found.' });
    return row;
  }

  async update(id: number, data: { nom?: string; nom_en?: string; code?: string; }) {
    await this.ensureExists(id);
    try {
      return await this.prisma.domaine.update({
        where: { id },
        data,
        select: { id: true, nom: true, nom_en: true, code: true, updated_at: true },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new BadRequestException({ message: 'Nom déjà utilisé.', messageE: 'Name already in use.' });
      }
      throw e;
    }
  }

  async remove(id: number) {
    // Interdit si référencé
    const used = await this.prisma.$transaction([
      this.prisma.typeInfrastructure.count({ where: { domaineId: id } }),
      this.prisma.sousDomaine.count({ where: { domaineId: id } }),
      this.prisma.infrastructure.count({ where: { domaineId: id } }),
    ]);
    const totalUsed = used.reduce((a,b)=>a+b,0);
    if (totalUsed > 0) {
      throw new BadRequestException({
        message: 'Domaine référencé — suppression interdite.',
        messageE: 'Domain referenced — deletion forbidden.',
      });
    }
    await this.prisma.domaine.delete({ where: { id } });
  }

  private async ensureExists(id: number) {
    const ok = await this.prisma.domaine.count({ where: { id } });
    if (!ok) throw new NotFoundException({ message: 'Domaine introuvable.', messageE: 'Domain not found.' });
  }
}
