// // src/role-permissions/role-permissions.service.ts
// import { BadRequestException, Injectable } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';

// function parseSort(sort?: string) {
//   if (!sort) return undefined as any;
//   const orderBy: any[] = [];
//   sort.split(',').map(s=>s.trim()).filter(Boolean).forEach(t=>{
//     if (t.startsWith('-')) orderBy.push({ [t.slice(1)]: 'desc' });
//     else orderBy.push({ [t]: 'asc' });
//   });
//   return orderBy.length ? orderBy : undefined;
// }

// @Injectable()
// export class RolePermissionsService {
//   constructor(private readonly prisma: PrismaService) {}

//   async list(q: { page:number; pageSize:number; sort?:string; roleId?:number; permissionId?:number; q?:string }) {
//     const where: any = {};
//     if (q.roleId) where.roleId = q.roleId;
//     if (q.permissionId) where.permissionId = q.permissionId;
//     if (q.q) where.permission = { code: { contains: q.q, mode: 'insensitive' } };

//     const [total, rows] = await this.prisma.$transaction([
//       this.prisma.rolePermission.count({ where }),
//       this.prisma.rolePermission.findMany({
//         where,
//         orderBy: parseSort(q.sort) ?? [{ roleId: 'asc' }, { permissionId: 'asc' }],
//         skip: (q.page - 1) * q.pageSize,
//         take: q.pageSize,
//         select: {
//           roleId: true,
//           permissionId: true,
//           role: { select: { id: true, nom: true } },
//           permission: { select: { id: true, code: true } },
//         },
//       }),
//     ]);

//     const items = rows.map(r => ({
//       role: r.role,
//       permission: r.permission,
//     }));
//     return { total, items };
//   }

//   async attach(roleId: number, permissionIds: number[]) {
//     const role = await this.prisma.role.findUnique({ where: { id: roleId }, select: { id: true } });
//     if (!role) throw new BadRequestException({ message: 'Rôle invalide.', messageE: 'Invalid role.' });

//     const perms = await this.prisma.permission.findMany({ where: { id: { in: permissionIds } }, select: { id: true } });
//     const ok = new Set(perms.map(p => p.id));
//     const toCreate = permissionIds.filter(id => ok.has(id)).map(permissionId => ({ roleId, permissionId }));
//     if (!toCreate.length) throw new BadRequestException({ message: 'Aucune permission valide.', messageE: 'No valid permission.' });

//     await this.prisma.rolePermission.createMany({ data: toCreate, skipDuplicates: true });

//     const current = await this.prisma.rolePermission.findMany({
//       where: { roleId },
//       select: { permission: { select: { id: true, code: true } } },
//     });
//     return current.map(x => x.permission);
//   }

//   async detach(roleId: number, permissionIds: number[]) {
//     await this.prisma.rolePermission.deleteMany({ where: { roleId, permissionId: { in: permissionIds } } });
//     const current = await this.prisma.rolePermission.findMany({
//       where: { roleId },
//       select: { permission: { select: { id: true, code: true } } },
//     });
//     return current.map(x => x.permission);
//   }
// }
// src/role-permissions/role-permissions.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function parseSort(sort?: string) {
  if (!sort) return undefined as any;
  const orderBy: any[] = [];
  sort.split(',').map(s=>s.trim()).filter(Boolean).forEach(t=>{
    if (t.startsWith('-')) orderBy.push({ [t.slice(1)]: 'desc' });
    else orderBy.push({ [t]: 'asc' });
  });
  return orderBy.length ? orderBy : undefined;
}

@Injectable()
export class RolePermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: { page:number; pageSize:number; sort?:string; roleId?:number; permissionId?:number; q?:string }) {
    const where: any = {};
    if (q.roleId) where.roleId = q.roleId;
    if (q.permissionId) where.permissionId = q.permissionId;
    if (q.q) where.permission = { code: { contains: q.q, mode: 'insensitive' } };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.rolePermission.count({ where }),
      this.prisma.rolePermission.findMany({
        where,
        orderBy: parseSort(q.sort) ?? [{ roleId: 'asc' }, { permissionId: 'asc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        select: {
          roleId: true,
          permissionId: true,
          role: { select: { id: true, nom: true } },
          permission: { select: { id: true, code: true } },
        },
      }),
    ]);

    const items = rows.map(r => ({
      role: r.role,
      permission: r.permission,
    }));
    return { total, items };
  }

  async attach(roleId: number, permissionIds: number[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId }, select: { id: true } });
    if (!role) throw new BadRequestException({ message: 'Rôle invalide.', messageE: 'Invalid role.' });

    const perms = await this.prisma.permission.findMany({ where: { id: { in: permissionIds } }, select: { id: true } });
    const ok = new Set(perms.map(p => p.id));
    const toCreate = permissionIds.filter(id => ok.has(id)).map(permissionId => ({ roleId, permissionId }));
    if (!toCreate.length) throw new BadRequestException({ message: 'Aucune permission valide.', messageE: 'No valid permission.' });

    await this.prisma.rolePermission.createMany({ data: toCreate, skipDuplicates: true });

    const current = await this.prisma.rolePermission.findMany({
      where: { roleId },
      select: { permission: { select: { id: true, code: true } } },
    });
    return current.map(x => x.permission);
  }

  async detach(roleId: number, permissionIds: number[]) {
    await this.prisma.rolePermission.deleteMany({ where: { roleId, permissionId: { in: permissionIds } } });
    const current = await this.prisma.rolePermission.findMany({
      where: { roleId },
      select: { permission: { select: { id: true, code: true } } },
    });
    return current.map(x => x.permission);
  }
}
