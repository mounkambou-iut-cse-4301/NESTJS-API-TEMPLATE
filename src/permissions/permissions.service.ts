// src/permissions/permissions.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function parseSort(sort?: string) {
  if (!sort) return undefined as any;
  const orderBy: any[] = [];
  sort.split(',').map(s => s.trim()).filter(Boolean).forEach(t => {
    if (t.startsWith('-')) orderBy.push({ [t.slice(1)]: 'desc' });
    else orderBy.push({ [t]: 'asc' });
  });
  return orderBy.length ? orderBy : undefined;
}

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: { page: number; pageSize: number; sort?: string; q?: string }) {
    const where: any = {};
    if (q.q) where.code = { contains: q.q, mode: 'insensitive' };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.permission.count({ where }),
      this.prisma.permission.findMany({
        where,
        orderBy: parseSort(q.sort) ?? [{ id: 'desc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        select: { id: true, code: true },
      }),
    ]);
    return { total, items };
  }

  async getOne(id: number) {
    const row = await this.prisma.permission.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        roles: { select: { role: { select: { id: true, nom: true } } } },
      },
    });
    if (!row) throw new NotFoundException({ message: 'Permission introuvable.', messageE: 'Permission not found.' });
    return { id: row.id, code: row.code, roles: row.roles.map(r => r.role) };
  }
}
