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
// export class TypeCommunesService {
//   constructor(private readonly prisma: PrismaService) {}

//   async list(params: { page: number; pageSize: number; sort?: Order; q?: string }) {
//     const { page, pageSize, sort, q } = params;
//     const where: any = {};
//     if (q) where.name = { contains: q, mode: 'insensitive' };

//     const [total, items] = await this.prisma.$transaction([
//       this.prisma.typeCommune.count({ where }),
//       this.prisma.typeCommune.findMany({
//         where,
//         orderBy: sort ?? { name: 'asc' },
//         skip: (page - 1) * pageSize,
//         take: pageSize,
//         select: { id: true, name: true, created_at: true, updated_at: true },
//       }),
//     ]);
//     return { items, meta: buildMeta(page, pageSize, total) };
//   }

//   async create(dto: { name: string }) {
//     try {
//       return await this.prisma.typeCommune.create({
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
//     const row = await this.prisma.typeCommune.findUnique({
//       where: { id }, select: { id: true, name: true, created_at: true, updated_at: true },
//     });
//     if (!row) throw new NotFoundException({ message: 'TypeCommune introuvable.', messageE: 'TypeCommune not found.' });
//     return row;
//   }

//   async update(id: number, dto: { name?: string }) {
//     try {
//       const row = await this.prisma.typeCommune.update({
//         where: { id }, data: { name: dto.name },
//         select: { id: true, name: true, created_at: true, updated_at: true },
//       });
//       return row;
//     } catch (e: any) {
//       if (e.code === 'P2025') {
//         throw new NotFoundException({ message: 'TypeCommune introuvable.', messageE: 'TypeCommune not found.' });
//       }
//       if (e.code === 'P2002') {
//         throw new BadRequestException({ message: 'Nom déjà utilisé.', messageE: 'Name already in use.' });
//       }
//       throw e;
//     }
//   }
// }
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
export class TypeCommunesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { page: number; pageSize: number; sort?: Order; q?: string }) {
    const { page, pageSize, sort, q } = params;
    const where: any = {};
    if (q) where.name = { contains: q, mode: 'insensitive' };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.typeCommune.count({ where }),
      this.prisma.typeCommune.findMany({
        where,
        orderBy: sort ?? { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, name: true, created_at: true, updated_at: true },
      }),
    ]);
    return { items, meta: buildMeta(page, pageSize, total) };
  }

  async create(dto: { name: string }) {
    try {
      return await this.prisma.typeCommune.create({
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
    const row = await this.prisma.typeCommune.findUnique({
      where: { id }, select: { id: true, name: true, created_at: true, updated_at: true },
    });
    if (!row) throw new NotFoundException({ message: 'TypeCommune introuvable.', messageE: 'TypeCommune not found.' });
    return row;
  }

  async update(id: number, dto: { name?: string }) {
    try {
      const row = await this.prisma.typeCommune.update({
        where: { id }, data: { name: dto.name },
        select: { id: true, name: true, created_at: true, updated_at: true },
      });
      return row;
    } catch (e: any) {
      if (e.code === 'P2025') {
        throw new NotFoundException({ message: 'TypeCommune introuvable.', messageE: 'TypeCommune not found.' });
      }
      if (e.code === 'P2002') {
        throw new BadRequestException({ message: 'Nom déjà utilisé.', messageE: 'Name already in use.' });
      }
      throw e;
    }
  }
}
