import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function parseSort(sort?: string) {
  if (!sort) return undefined as any;

  const orderBy: any[] = [];
  sort
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((t) => {
      if (t.startsWith('-')) orderBy.push({ [t.slice(1)]: 'desc' });
      else orderBy.push({ [t]: 'asc' });
    });

  return orderBy.length ? orderBy : undefined;
}

@Injectable()
export class UserRolesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: {
    page: number;
    pageSize: number;
    sort?: string;
    userId?: number;
    roleId?: number;
  }) {
    const where: any = {};
    if (q.userId) where.utilisateurId = q.userId;
    if (q.roleId) where.roleId = q.roleId;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.utilisateurRole.count({ where }),
      this.prisma.utilisateurRole.findMany({
        where,
        orderBy: parseSort(q.sort) ?? [{ utilisateurId: 'asc' }, { roleId: 'asc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        select: {
          utilisateurId: true,
          roleId: true,
          user: {
            select: { id: true, nom: true, email: true },
          },
          role: {
            select: { id: true, nom: true },
          },
        },
      }),
    ]);

    return {
      total,
      items: items.map((x) => ({
        utilisateurId: x.utilisateurId,
        roleId: x.roleId,
        user: x.user,
        role: x.role,
      })),
    };
  }

  async assign(userId: number, roleIds: number[]) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException({
        message: 'Utilisateur invalide.',
        messageE: 'Invalid user.',
      });
    }

    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true },
    });

    const validIds = new Set(roles.map((r) => r.id));
    const toCreate = roleIds
      .filter((id) => validIds.has(id))
      .map((roleId) => ({ utilisateurId: userId, roleId }));

    if (!toCreate.length) {
      throw new BadRequestException({
        message: 'Aucun rôle valide fourni.',
        messageE: 'No valid role provided.',
      });
    }

    await this.prisma.utilisateurRole.createMany({
      data: toCreate,
      skipDuplicates: true,
    });

    const current = await this.prisma.utilisateurRole.findMany({
      where: { utilisateurId: userId },
      select: {
        role: { select: { id: true, nom: true } },
      },
      orderBy: { roleId: 'asc' },
    });

    return current.map((r) => r.role);
  }

  async revoke(userId: number, roleIds: number[]) {
    await this.prisma.utilisateurRole.deleteMany({
      where: {
        utilisateurId: userId,
        roleId: { in: roleIds },
      },
    });

    const current = await this.prisma.utilisateurRole.findMany({
      where: { utilisateurId: userId },
      select: {
        role: { select: { id: true, nom: true } },
      },
      orderBy: { roleId: 'asc' },
    });

    return current.map((r) => r.role);
  }
}