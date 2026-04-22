
// src/roles/roles.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function parseSort(sort?: string) {
  if (!sort) return undefined as any;
  const pieces = sort.split(',').map(s => s.trim()).filter(Boolean);
  const orderBy: any[] = [];
  for (const p of pieces) {
    if (p.startsWith('-')) orderBy.push({ [p.slice(1)]: 'desc' });
    else orderBy.push({ [p]: 'asc' });
  }
  return orderBy.length ? orderBy : undefined;
}

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: { page: number; pageSize: number; sort?: string; q?: string; permissionCode?: string }) {
    const where: any = {};
    if (q?.q) where.nom = { contains: q.q, mode: 'insensitive' };
    if (q?.permissionCode) {
      where.perms = { some: { permission: { code: { contains: q.permissionCode, mode: 'insensitive' } } } };
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.role.count({ where }),
      this.prisma.role.findMany({
        where,
        orderBy: parseSort(q.sort) ?? [{ nom: 'asc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        select: {
          id: true,
          nom: true,
          users: { select: { utilisateurId: true } },
          perms: { select: { permission: { select: { id: true, code: true } } } },
        },
      }),
    ]);

    const data = items.map(r => ({
      id: r.id,
      nom: r.nom,
      users_count: r.users.length,
      permissions: r.perms.map(p => p.permission),
    }));

    return { total, items: data };
  }

  async create(nom: string) {
    try {
      const row = await this.prisma.role.create({ data: { nom }, select: { id: true, nom: true } });
      return row;
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new BadRequestException({ message: 'Rôle déjà existant.', messageE: 'Role already exists.' });
      }
      throw e;
    }
  }

  async getOne(id: number) {
    const row = await this.prisma.role.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        users: { select: { utilisateurId: true } },
        perms: { select: { permission: { select: { id: true, code: true } } } },
      },
    });
    if (!row) throw new NotFoundException({ message: 'Rôle introuvable.', messageE: 'Role not found.' });
    return {
      id: row.id,
      nom: row.nom,
      users_count: row.users.length,
      permissions: row.perms.map(p => p.permission),
    };
  }

  async update(id: number, nom?: string) {
    await this.ensure(id);
    if (!nom) return await this.getOne(id);
    try {
      await this.prisma.role.update({ where: { id }, data: { nom } });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new BadRequestException({ message: 'Nom de rôle déjà utilisé.', messageE: 'Role name already used.' });
      }
      throw e;
    }
    return await this.getOne(id);
  }

  private async ensure(id: number) {
    const exists = await this.prisma.role.count({ where: { id } });
    if (!exists) throw new NotFoundException({ message: 'Rôle introuvable.', messageE: 'Role not found.' });
  }
}
