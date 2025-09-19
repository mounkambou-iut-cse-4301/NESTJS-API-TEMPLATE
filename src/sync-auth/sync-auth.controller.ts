// src/sync-auth/sync-auth.controller.ts (CENTRAL)
import { Body, Controller, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { CentralAuthBundleDto } from './dto/central-auth-bundle.dto';

@ApiTags('sync/auth')
@Controller('sync/auth')
export class SyncAuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('bundle')
  async bundle(@Body() dto: CentralAuthBundleDto) {
    // dto.email et dto.password sont maintenant présents
    const email = dto.email.trim();

    const user = await this.prisma.utilisateur.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: {
        id: true, nom: true, email: true, telephone: true, communeId: true,
        is_block: true, is_verified: true, photo_url: true, ville: true, adresse: true,
        mot_de_passe: true,
      },
    });
    if (!user) return { ok: false, reason: 'invalid_credentials' };

    const passOk = await bcrypt.compare(dto.password, user.mot_de_passe);
    if (!passOk) return { ok: false, reason: 'invalid_credentials' };
    if (user.is_block) return { ok: false, reason: 'blocked' };

    const userRoles = await this.prisma.utilisateurRole.findMany({
      where: { utilisateurId: user.id },
      select: { utilisateurId: true, roleId: true },
    });
    const roleIds = [...new Set(userRoles.map(ur => ur.roleId))];

    const [roles, permissions, rolePermissions] = await Promise.all([
      this.prisma.role.findMany({
        where: { id: { in: roleIds.length ? roleIds : [0] } },
        select: { id: true, nom: true },
      }),
      this.prisma.permission.findMany({ select: { id: true, code: true } }),
      this.prisma.rolePermission.findMany({
        where: { roleId: { in: roleIds.length ? roleIds : [0] } },
        select: { roleId: true, permissionId: true },
      }),
    ]);

    return {
      ok: true,
      generatedAt: new Date().toISOString(),
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        mot_de_passe: user.mot_de_passe,
        telephone: user.telephone,
        communeId: user.communeId,
        is_block: user.is_block,
        is_verified: user.is_verified,
        photo_url: user.photo_url,
        ville: user.ville,
        adresse: user.adresse,
      },
      roles,
      userRoles,
      permissions,
      rolePermissions,
    };
  }
}
