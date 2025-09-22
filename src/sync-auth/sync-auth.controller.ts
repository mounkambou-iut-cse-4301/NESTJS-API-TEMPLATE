// // src/sync-auth/sync-auth.controller.ts (CENTRAL)
// import { Body, Controller, Post } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { ApiTags } from '@nestjs/swagger';
// import * as bcrypt from 'bcryptjs';
// import { CentralAuthBundleDto } from './dto/central-auth-bundle.dto';
// import { SettingsService } from 'src/settings/settings.service';

// @ApiTags('sync/auth')
// @Controller('sync/auth')
// export class SyncAuthController {
//   constructor(private readonly prisma: PrismaService, private readonly settingsService: SettingsService,) {}

//   @Post('bundle')
//   async bundle(@Body() dto: CentralAuthBundleDto) {
//     // dto.email et dto.password sont maintenant présents
//     const email = dto.email.trim();

//     const user = await this.prisma.utilisateur.findFirst({
//       where: { email: { equals: email, mode: 'insensitive' } },
//       select: {
//         id: true, nom: true, email: true, telephone: true, communeId: true,
//         is_block: true, is_verified: true, photo_url: true, ville: true, adresse: true,
//         mot_de_passe: true,
//       },
//     });
//     if (!user) return { ok: false, reason: 'invalid_credentials' };

//     const passOk = await bcrypt.compare(dto.password, user.mot_de_passe);
//     if (!passOk) return { ok: false, reason: 'invalid_credentials' };
//     if (user.is_block) return { ok: false, reason: 'blocked' };

//     const userRoles = await this.prisma.utilisateurRole.findMany({
//       where: { utilisateurId: user.id },
//       select: { utilisateurId: true, roleId: true },
//     });
//     const roleIds = [...new Set(userRoles.map(ur => ur.roleId))];

//     const [roles, permissions, rolePermissions] = await Promise.all([
//       this.prisma.role.findMany({
//         where: { id: { in: roleIds.length ? roleIds : [0] } },
//         select: { id: true, nom: true },
//       }),
//       this.prisma.permission.findMany({ select: { id: true, code: true } }),
//       this.prisma.rolePermission.findMany({
//         where: { roleId: { in: roleIds.length ? roleIds : [0] } },
//         select: { roleId: true, permissionId: true },
//       }),
//     ]);
// // ===== NOUVEAU : activer la commune de l’utilisateur si possible (plafond)
//     const communeActivation = await this.settingsService.activateUserCommuneIfAllowed(user.id);
//     // communeActivation = { activated: boolean, reason: string }
//     return {
//       ok: true,
//       generatedAt: new Date().toISOString(),
//       user: {
//         id: user.id,
//         nom: user.nom,
//         email: user.email,
//         mot_de_passe: user.mot_de_passe,
//         telephone: user.telephone,
//         communeId: user.communeId,
//         is_block: user.is_block,
//         is_verified: user.is_verified,
//         photo_url: user.photo_url,
//         ville: user.ville,
//         adresse: user.adresse,
//       },
//       roles,
//       userRoles,
//       permissions,
//       rolePermissions,
//     };
//   }
// }
// src/sync-auth/sync-auth.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { CentralAuthBundleDto } from './dto/central-auth-bundle.dto';
import { SettingsService } from 'src/settings/settings.service';

@ApiTags('sync/auth')
@Controller('sync/auth')
export class SyncAuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  @Post('bundle')
  async bundle(@Body() dto: CentralAuthBundleDto) {
    const email = dto.email.trim();

    // 1) Auth de l'utilisateur
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

    // 2) Rôles + permissions
    const userRoles = await this.prisma.utilisateurRole.findMany({
      where: { utilisateurId: user.id },
      select: { utilisateurId: true, roleId: true },
    });
    const roleIds = [...new Set(userRoles.map((ur) => ur.roleId))];

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

    // 3) Pré-check du plafond AVANT tout appel d'activation
    //    - Si non active ET plafond atteint → on renvoie une erreur (sans appel à activateUserCommuneIfAllowed).
    let communeActivation:
      | { activated: boolean; reason: string }
      | undefined;

    if (user.communeId) {
      // const commune = await this.prisma.commune.findUnique({
      //   where: { id: user.communeId },
      //   select: { id: true, is_verified: true },
      // });
        // Commune pas encore active : vérifier le plafond
        const settings = await this.settingsService.getOne(); // garantit l'existence
        const totalActive = await this.prisma.commune.count({
          where: { is_verified: true },
        });

        if (totalActive >= settings.maxActivatedCommunes) {
          // Plafond atteint → on NE rappelle PAS activateUserCommuneIfAllowed et on renvoie une erreur
          return {
            ok: false,
            reason: 'Error',
            message:
              "Erreur",
            messageE:
              'Error',
          };
        }

        // Plafond non atteint → on peut tenter l'activation (será re-validée en transaction par le service)
        communeActivation = await this.settingsService.activateUserCommuneIfAllowed(
          user.id,
        );
      
    } else {
      // L'utilisateur n'a pas de commune liée : on continue sans activation.
      communeActivation = { activated: false, reason: 'no_commune_for_user' };
    }

    // 4) Réponse finale
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
      communeActivation,
    };
  }
}
