// import { SousDomaine } from './../../generated/prisma/index.d';
// import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';

// type Order = Record<string, 'asc'|'desc'>;
// function sanitizeSort(sort: string | undefined, allowed: string[]) {
//   if (!sort) return undefined;
//   const orders: Order = {};
//   for (const t of sort.split(',').map(s=>s.trim()).filter(Boolean)) {
//     const desc = t.startsWith('-'); const key = desc ? t.slice(1) : t;
//     if (allowed.includes(key)) orders[key] = desc ? 'desc' : 'asc';
//   }
//   return Object.keys(orders).length ? orders : undefined;
// }
// function buildMeta(page: number, pageSize: number, total: number) {
//   const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
//   return { page, pageSize, total, totalPages };
// }

// @Injectable()
// export class CompetencesService {
//   constructor(private readonly prisma: PrismaService) {}

//   async list(params: { page: number; pageSize: number; sort?: Order; q?: string, sousDomaineId?: number }): Promise<{ items: any[]; meta: any }> {
//     const { page, pageSize, sort, q, sousDomaineId } = params;
//     const where: any = {};
//     if (q) where.name = { contains: q, mode: 'insensitive' };
//     if (sousDomaineId) where.sousDomaineId = sousDomaineId;

//     const [total, items] = await this.prisma.$transaction([
//       this.prisma.competence.count({ where }),
//       this.prisma.competence.findMany({
//         where,
//         orderBy: sort ?? { name: 'asc' },
//         skip: (page - 1) * pageSize,
//         take: pageSize,
//         select: { id: true, name: true, created_at: true, updated_at: true,sousDomaine:true,sousDomaineId:true },
//       }),
//     ]);
//     return { items, meta: buildMeta(page, pageSize, total) };
//   }

//   async create(dto: { name: string }) {
//     try {
//       return await this.prisma.competence.create({
//         data: { name: dto.name },
//         select: { id: true, name: true, created_at: true, updated_at: true },
//       });
//     } catch (e: any) {
//       if (e.code === 'P2002') {
//         throw new BadRequestException({ message: 'Nom déjà utilisé.', messageE: 'Name already in use.' });
//       }
//       throw e;
//     }
//   }

//   async findOne(id: number) {
//     const row = await this.prisma.competence.findUnique({
//       where: { id }, select: { id: true, name: true, created_at: true, updated_at: true,sousDomaine:true },
//     });
//     if (!row) throw new NotFoundException({ message: 'Compétence introuvable.', messageE: 'Competence not found.' });
//     return row;
//   }

//   async update(id: number, dto: { name?: string }) {
//     try {
//       const row = await this.prisma.competence.update({
//         where: { id }, data: { name: dto.name },
//         select: { id: true, name: true, created_at: true, updated_at: true },
//       });
//       return row;
//     } catch (e: any) {
//       if (e.code === 'P2025') {
//         throw new NotFoundException({ message: 'Compétence introuvable.', messageE: 'Competence not found.' });
//       }
//       if (e.code === 'P2002') {
//         throw new BadRequestException({ message: 'Nom déjà utilisé.', messageE: 'Name already in use.' });
//       }
//       throw e;
//     }
//   }
// }
// src/competences/competences.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Order = Record<string, 'asc'|'desc'>;
function sanitizeSort(sort: string | undefined, allowed: string[]) {
  if (!sort) return undefined;
  const orders: Order = {};
  for (const t of sort.split(',').map(s=>s.trim()).filter(Boolean)) {
    const desc = t.startsWith('-'); const key = desc ? t.slice(1) : t;
    if (allowed.includes(key)) orders[key] = desc ? 'desc' : 'asc';
  }
  return Object.keys(orders).length ? orders : undefined;
}
function buildMeta(page: number, pageSize: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  return { page, pageSize, total, totalPages };
}

@Injectable()
export class CompetencesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { page: number; pageSize: number; sort?: Order; q?: string, sousDomaineId?: number }): Promise<{ items: any[]; meta: any }> {
    const { page, pageSize, sort, q, sousDomaineId } = params;
    const where: any = {};
    if (q) where.name = { contains: q, mode: 'insensitive' };
    if (sousDomaineId) where.sousDomaineId = sousDomaineId;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.competence.count({ where }),
      this.prisma.competence.findMany({
        where,
        orderBy: sort ?? { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, name: true, created_at: true, updated_at: true, sousDomaine: true, sousDomaineId: true },
      }),
    ]);
    return { items, meta: buildMeta(page, pageSize, total) };
  }

  async create(dto: { name: string }) {
    try {
      return await this.prisma.competence.create({
        data: { name: dto.name },
        select: { id: true, name: true, created_at: true, updated_at: true },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new BadRequestException({ message: 'Nom déjà utilisé.', messageE: 'Name already in use.' });
      }
      throw e;
    }
  }

  async findOne(id: number) {
    const row = await this.prisma.competence.findUnique({
      where: { id }, select: { id: true, name: true, created_at: true, updated_at: true, sousDomaine: true },
    });
    if (!row) throw new NotFoundException({ message: 'Compétence introuvable.', messageE: 'Competence not found.' });
    return row;
  }

  async update(id: number, dto: { name?: string }) {
    try {
      const row = await this.prisma.competence.update({
        where: { id }, data: { name: dto.name },
        select: { id: true, name: true, created_at: true, updated_at: true },
      });
      return row;
    } catch (e: any) {
      if (e.code === 'P2025') {
        throw new NotFoundException({ message: 'Compétence introuvable.', messageE: 'Competence not found.' });
      }
      if (e.code === 'P2002') {
        throw new BadRequestException({ message: 'Nom déjà utilisé.', messageE: 'Name already in use.' });
      }
      throw e;
    }
  }
}
