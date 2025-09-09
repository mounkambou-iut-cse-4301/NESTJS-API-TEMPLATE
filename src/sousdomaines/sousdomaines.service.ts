// import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';

// @Injectable()
// export class SousDomainesService {
//   constructor(private readonly prisma: PrismaService) {}

//   async list(params: { page:number; pageSize:number; sort?:Record<string,'asc'|'desc'>; q?:string; domaineId?:number; }) {
//     const { page, pageSize, sort, q, domaineId } = params;
//     const where: any = {};
//     if (q) {
//       where.OR = [
//         { nom:   { contains: q, mode: 'insensitive' } },
//         { nom_en:{ contains: q, mode: 'insensitive' } },
//         { code:  { contains: q, mode: 'insensitive' } },
//       ];
//     }
//     if (typeof domaineId === 'number') where.domaineId = domaineId;

//     const [total, items] = await this.prisma.$transaction([
//       this.prisma.sousDomaine.count({ where }),
//       this.prisma.sousDomaine.findMany({
//         where,
//         orderBy: sort ?? { nom: 'asc' },
//         skip: (page - 1) * pageSize,
//         take: pageSize,
//         select: {
//           id: true, nom: true, nom_en: true, code: true,
//           domaineId: true,
//           created_at: true, updated_at: true,
//         },
//       }),
//     ]);
//     return { total, items };
//   }

//   async create(data: { domaineId: number; nom: string; nom_en?: string; code?: string; }) {
//     // vérifie FK domaine
//     const dom = await this.prisma.domaine.count({ where: { id: data.domaineId } });
//     if (!dom) throw new BadRequestException({ message: 'Domaine invalide.', messageE: 'Invalid domain.' });

//     return await this.prisma.sousDomaine.create({
//       data,
//       select: { id: true, domaineId: true, nom: true, nom_en: true, code: true },
//     });
//   }

//   async findOne(id: number) {
//     const row = await this.prisma.sousDomaine.findUnique({
//       where: { id },
//       select: {
//         id: true, domaineId: true, nom: true, nom_en: true, code: true,
//         created_at: true, updated_at: true,
//       },
//     });
//     if (!row) throw new NotFoundException({ message: 'Sous-domaine introuvable.', messageE: 'Subdomain not found.' });
//     return row;
//   }

//   async update(id: number, data: { domaineId?: number; nom?: string; nom_en?: string; code?: string; }) {
//     await this.ensureExists(id);
//     if (typeof data.domaineId === 'number') {
//       const dom = await this.prisma.domaine.count({ where: { id: data.domaineId } });
//       if (!dom) throw new BadRequestException({ message: 'Domaine invalide.', messageE: 'Invalid domain.' });
//     }
//     return await this.prisma.sousDomaine.update({
//       where: { id },
//       data,
//       select: { id: true, domaineId: true, nom: true, nom_en: true, code: true, updated_at: true },
//     });
//   }

//   async remove(id: number) {
//     // Refus si référencé
//     const used = await this.prisma.$transaction([
//       this.prisma.typeInfrastructure.count({ where: { sousdomaineId: id } }),
//       this.prisma.infrastructure.count({ where: { sousdomaineId: id } }),
//     ]);
//     if (used.reduce((a,b)=>a+b,0) > 0) {
//       throw new BadRequestException({
//         message: 'Sous-domaine référencé — suppression interdite.',
//         messageE: 'Subdomain referenced — deletion forbidden.',
//       });
//     }
//     await this.prisma.sousDomaine.delete({ where: { id } });
//   }

//   private async ensureExists(id: number) {
//     const ok = await this.prisma.sousDomaine.count({ where: { id } });
//     if (!ok) throw new NotFoundException({ message: 'Sous-domaine introuvable.', messageE: 'Subdomain not found.' });
//   }
// }
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SousDomainesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { page:number; pageSize:number; sort?:Record<string,'asc'|'desc'>; q?:string; domaineId?:number; }) {
    const { page, pageSize, sort, q, domaineId } = params;
    const where: any = {};
    if (q) {
      where.OR = [
        { nom:   { contains: q, mode: 'insensitive' } },
        { nom_en:{ contains: q, mode: 'insensitive' } },
        { code:  { contains: q, mode: 'insensitive' } },
      ];
    }
    if (typeof domaineId === 'number') where.domaineId = domaineId;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.sousDomaine.count({ where }),
      this.prisma.sousDomaine.findMany({
        where,
        orderBy: sort ?? { nom: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, nom: true, nom_en: true, code: true,
          domaineId: true,
          created_at: true, updated_at: true,
        },
      }),
    ]);
    return { total, items };
  }

  async create(data: { domaineId: number; nom: string; nom_en?: string; code?: string; }) {
    const dom = await this.prisma.domaine.count({ where: { id: data.domaineId } });
    if (!dom) throw new BadRequestException({ message: 'Domaine invalide.', messageE: 'Invalid domain.' });

    return await this.prisma.sousDomaine.create({
      data,
      select: { id: true, domaineId: true, nom: true, nom_en: true, code: true },
    });
  }

  async findOne(id: number) {
    const row = await this.prisma.sousDomaine.findUnique({
      where: { id },
      select: {
        id: true, domaineId: true, nom: true, nom_en: true, code: true,
        created_at: true, updated_at: true,
      },
    });
    if (!row) throw new NotFoundException({ message: 'Sous-domaine introuvable.', messageE: 'Subdomain not found.' });
    return row;
  }

  async update(id: number, data: { domaineId?: number; nom?: string; nom_en?: string; code?: string; }) {
    await this.ensureExists(id);
    if (typeof data.domaineId === 'number') {
      const dom = await this.prisma.domaine.count({ where: { id: data.domaineId } });
      if (!dom) throw new BadRequestException({ message: 'Domaine invalide.', messageE: 'Invalid domain.' });
    }
    return await this.prisma.sousDomaine.update({
      where: { id },
      data,
      select: { id: true, domaineId: true, nom: true, nom_en: true, code: true, updated_at: true },
    });
  }

  async remove(id: number) {
    const used = await this.prisma.$transaction([
      this.prisma.typeInfrastructure.count({ where: { sousdomaineId: id } }),
      this.prisma.infrastructure.count({ where: { sousdomaineId: id } }),
    ]);
    if (used.reduce((a,b)=>a+b,0) > 0) {
      throw new BadRequestException({
        message: 'Sous-domaine référencé — suppression interdite.',
        messageE: 'Subdomain referenced — deletion forbidden.',
      });
    }
    await this.prisma.sousDomaine.delete({ where: { id } });
  }

  private async ensureExists(id: number) {
    const ok = await this.prisma.sousDomaine.count({ where: { id } });
    if (!ok) throw new NotFoundException({ message: 'Sous-domaine introuvable.', messageE: 'Subdomain not found.' });
  }
}
