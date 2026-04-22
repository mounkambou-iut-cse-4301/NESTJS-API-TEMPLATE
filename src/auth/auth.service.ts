import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, TypeUtilisateur } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmailService } from '../utils/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
  ) {}

  /**
   * Normalise le téléphone pour éviter les faux écarts de comparaison.
   */
  private normalizePhone(phone: string): string {
    return (phone || '').trim();
  }

  /**
   * Construit les rôles + permissions à partir des relations Prisma.
   */
  private async buildRolesAndPermissions(userId: number) {
    const userRoles = await this.prisma.utilisateurRole.findMany({
      where: { utilisateurId: userId },
      include: { role: true },
    });

    const roles = userRoles.map((ur) => ({
      id: ur.role.id,
      nom: ur.role.nom,
    }));

    const roleIds = userRoles.map((ur) => ur.roleId);

    let permissions: string[] = [];

    const isSuperAdmin = roles.some((r) =>
      ['SUPER_ADMIN', 'SUPERADMIN'].includes(r.nom),
    );

    if (isSuperAdmin) {
      const allPerms = await this.prisma.permission.findMany({
        select: { code: true },
      });
      permissions = allPerms.map((p) => p.code);
    } else if (roleIds.length > 0) {
      const rolePerms = await this.prisma.rolePermission.findMany({
        where: { roleId: { in: roleIds } },
        include: { permission: true },
      });

      permissions = Array.from(
        new Set(rolePerms.map((rp) => rp.permission.code)),
      );
    }

    return { roles, permissions };
  }

  /**
   * Incrémente les tentatives échouées pour les comptes ciblés.
   * À 5 échecs, le compte est bloqué.
   */
  private async incrementFailedAttempts(userIds: number[]): Promise<void> {
    if (!userIds.length) return;

    const users = await this.prisma.utilisateur.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        nombre_attempts: true,
        is_block: true,
      },
    });

    const updates = users
      .filter((u) => !u.is_block)
      .map((u) => {
        const nextAttempts = (u.nombre_attempts ?? 0) + 1;
        const shouldBlock = nextAttempts >= 5;

        return this.prisma.utilisateur.update({
          where: { id: u.id },
          data: {
            nombre_attempts: nextAttempts,
            is_block: shouldBlock,
          },
        });
      });

    if (updates.length) {
      await this.prisma.$transaction(updates);
    }
  }

  /**
   * LOGIN
   * Le login est fait avec telephone + type + mot_de_passe
   * pour cibler précisément le bon compte.
   */
  async login(dto: LoginDto) {
    const telephone = this.normalizePhone(dto.telephone);

    const candidates = await this.prisma.utilisateur.findMany({
      where: {
        telephone,
        type: dto.type,
      },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        nom: true,
        email: true,
        telephone: true,
        type: true,
        mot_de_passe: true,
        is_verified: true,
        is_block: true,
        nombre_attempts: true,
      },
    });

    if (!candidates.length) {
      throw new UnauthorizedException({
        message: 'Identifiants invalides.',
        messageE: 'Invalid credentials.',
      });
    }

    const matchedUsers: typeof candidates = [];

    for (const user of candidates) {
      const ok = await bcrypt.compare(dto.mot_de_passe, user.mot_de_passe);
      if (ok) {
        matchedUsers.push(user);
      }
    }

    const activeMatch = matchedUsers.find((u) => !u.is_block);
    if (activeMatch) {
      await this.prisma.utilisateur.update({
        where: { id: activeMatch.id },
        data: {
          nombre_attempts: 0,
          derniere_connexion: new Date(),
        },
      });

      const { roles, permissions } = await this.buildRolesAndPermissions(
        activeMatch.id,
      );

      const payload = {
        sub: activeMatch.id,
        user: {
          id: activeMatch.id,
          nom: activeMatch.nom,
          email: activeMatch.email,
          telephone: activeMatch.telephone,
          type: activeMatch.type,
          is_verified: activeMatch.is_verified,
          is_block: activeMatch.is_block,
        },
        roles,
        permissions,
      };

      const token = await this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET') || 'dev-secret',
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN') || '365d',
      });

      return {
        message: 'Connexion réussie.',
        messageE: 'Login successful.',
        token,
        user: payload.user,
        roles,
        permissions,
      };
    }

    const blockedMatch = matchedUsers.find((u) => u.is_block);
    if (blockedMatch) {
      throw new ForbiddenException({
        message: 'Votre compte est bloqué.',
        messageE: 'Your account is blocked.',
      });
    }

    await this.incrementFailedAttempts(candidates.map((u) => u.id));

    const refreshedUsers = await this.prisma.utilisateur.findMany({
      where: {
        id: { in: candidates.map((u) => u.id) },
      },
      select: {
        id: true,
        is_block: true,
      },
    });

    const hasNowBlockedUser = refreshedUsers.some((u) => u.is_block);

    if (hasNowBlockedUser) {
      throw new ForbiddenException({
        message:
          'Compte bloqué après 5 tentatives de connexion échouées.',
        messageE:
          'Account blocked after 5 failed login attempts.',
      });
    }

    throw new UnauthorizedException({
      message: 'Identifiants invalides.',
      messageE: 'Invalid credentials.',
    });
  }

  /**
   * Recherche d’un compte par type + (email ou téléphone)
   */
  private buildForgotWhere(dto: ForgotPasswordDto): Prisma.UtilisateurWhereInput {
    const or: Prisma.UtilisateurWhereInput[] = [];

    if (dto.telephone?.trim()) {
      or.push({
        telephone: this.normalizePhone(dto.telephone),
      });
    }

    if (dto.email?.trim()) {
      or.push({
        email: {
          equals: dto.email.trim(),
          mode: 'insensitive',
        },
      });
    }

    if (!or.length) {
      throw new BadRequestException({
        message: 'Le téléphone ou l’email est requis.',
        messageE: 'Phone or email is required.',
      });
    }

    return {
      type: dto.type,
      ...(or.length === 1 ? or[0] : { OR: or }),
    };
  }

  /**
   * FORGOT PASSWORD
   * On garde une réponse neutre pour éviter l’énumération des comptes.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const where = this.buildForgotWhere(dto);

    const user = await this.prisma.utilisateur.findFirst({
      where,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        nom: true,
        email: true,
        telephone: true,
        type: true,
        is_block: true,
      },
    });

    if (!user) {
      return {
        message:
          'Si le compte existe, les informations de réinitialisation ont été générées.',
        messageE:
          'If the account exists, reset information has been generated.',
        data: {
          token: null,
          expires_in: null,
        },
      };
    }

    const code = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0');

    const codeHash = await bcrypt.hash(code, 10);
    const jti = randomBytes(8).toString('hex');

    const resetSecret =
      this.config.get<string>('JWT_RESET_SECRET') || 'dev-reset-secret';
    const resetExpires =
      this.config.get<string>('JWT_RESET_EXPIRES') || '15m';

    const token = await this.jwt.signAsync(
      {
        sub: user.id,
        typ: 'reset',
        jti,
        type: user.type,
        email: user.email,
        telephone: user.telephone,
        codeHash,
      },
      {
        secret: resetSecret,
        expiresIn: resetExpires,
      },
    );

    if (user.email) {
      const subject =
        'Dezoumay — Réinitialisation du mot de passe / Password reset';

      const message =
        `Bonjour ${user.nom},\n\n` +
        `Code de vérification : ${code}\n` +
        `Token de réinitialisation :\n${token}\n\n` +
        `⚠️ Expire dans ${resetExpires}.\n\n` +
        `---\n` +
        `Hello ${user.nom},\n\n` +
        `Verification code: ${code}\n` +
        `Reset token:\n${token}\n\n` +
        `⚠️ Expires in ${resetExpires}.\n`;

      await this.email.sendEmail(subject, message, user.email);
    }

    return {
      message:
        'Si le compte existe, les informations de réinitialisation ont été générées.',
      messageE:
        'If the account exists, reset information has been generated.',
      data: {
        token,
        expires_in: resetExpires,
      },
    };
  }

  /**
   * RESET PASSWORD
   * Après reset réussi :
   * - mot de passe hashé
   * - nombre_attempts remis à 0
   * - compte débloqué
   */
  async resetPassword(dto: ResetPasswordDto) {
    const resetSecret =
      this.config.get<string>('JWT_RESET_SECRET') || 'dev-reset-secret';

    let payload: any;

    try {
      payload = await this.jwt.verifyAsync(dto.token, {
        secret: resetSecret,
      });
    } catch {
      throw new BadRequestException({
        message: 'Token de réinitialisation invalide ou expiré.',
        messageE: 'Reset token invalid or expired.',
      });
    }

    if (!payload?.sub || payload?.typ !== 'reset' || !payload?.codeHash) {
      throw new BadRequestException({
        message: 'Token de réinitialisation invalide.',
        messageE: 'Invalid reset token.',
      });
    }

    const codeOk = await bcrypt.compare(dto.code, payload.codeHash);
    if (!codeOk) {
      throw new BadRequestException({
        message: 'Code de vérification incorrect.',
        messageE: 'Verification code is incorrect.',
      });
    }

    const newHash = await bcrypt.hash(dto.new_password, 10);

    await this.prisma.utilisateur.update({
      where: { id: Number(payload.sub) },
      data: {
        mot_de_passe: newHash,
        nombre_attempts: 0,
        is_block: false,
      },
    });
  }

  /**
   * CHANGE PASSWORD
   * Utilisateur connecté.
   */
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mot_de_passe: true,
        is_block: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        message: 'Utilisateur introuvable.',
        messageE: 'User not found.',
      });
    }

    if (user.is_block) {
      throw new ForbiddenException({
        message: 'Votre compte est bloqué.',
        messageE: 'Your account is blocked.',
      });
    }

    const oldPasswordOk = await bcrypt.compare(
      dto.old_password,
      user.mot_de_passe,
    );

    if (!oldPasswordOk) {
      throw new BadRequestException({
        message: 'Ancien mot de passe incorrect.',
        messageE: 'Old password is incorrect.',
      });
    }

    const newHash = await bcrypt.hash(dto.new_password, 10);

    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: {
        mot_de_passe: newHash,
        nombre_attempts: 0,
      },
    });
  }
}