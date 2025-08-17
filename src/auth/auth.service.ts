// src/auth/auth.service.ts
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmailService } from '../utils/email.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
  ) {}
 /** POST /auth/login — email + mot_de_passe → JWT signé (payload lisible) */
  async login(dto: LoginDto) {
    // 1) Cherche l’utilisateur (sans include compliqué)
    const user = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException({ message: 'Identifiants invalides.', messageE: 'Invalid credentials.' });
    }

    // 2) Vérifie le mot de passe (bcrypt)
    const ok = await bcrypt.compare(dto.mot_de_passe, user.mot_de_passe);
    if (!ok) {
      throw new UnauthorizedException({ message: 'Identifiants invalides.', messageE: 'Invalid credentials.' });
    }
    if (user.is_block) {
      throw new UnauthorizedException({ message: 'Compte bloqué.', messageE: 'Account blocked.' });
    }

    // 3) Récupère rôles puis permissions (séparément → typage simple et robuste)
    const userRoles = await this.prisma.utilisateurRole.findMany({
      where: { utilisateurId: user.id },
      include: { role: true }, // role: { id, nom }
    });
    const roleIds = userRoles.map((ur) => ur.roleId);

    const rolePerms = roleIds.length
      ? await this.prisma.rolePermission.findMany({
          where: { roleId: { in: roleIds } },
          include: { permission: true }, // permission: { id, code }
        })
      : [];

    const roles = userRoles.map((ur) => ({ id: ur.role.id, nom: ur.role.nom }));
    const permSet = new Set<string>();
    rolePerms.forEach((rp) => permSet.add(rp.permission.code));

    // 4) JWT payload lisible
    const payload = {
      sub: user.id,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        telephone: user.telephone ?? null,
        communeId: user.communeId ?? null,
        is_block: user.is_block,
        is_verified: user.is_verified,
        photo_url: user.photo_url ?? null,
      },
      roles,
      permissions: Array.from(permSet),
    };

    const token = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET') || 'dev-secret',
      expiresIn: '1d',
    });

    return {
      message: 'Connexion réussie.',
      messageE: 'Login successful.',
      token,
      user: payload.user,
      roles,
      permissions: payload.permissions,
    };
  }

  // ===== Étape 1 — FORGOT =====
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, nom: true, is_block: true },
    });

    // Toujours réponse OK, même si email inconnu
    if (!user || user.is_block) {
      return { data: { token: null, expires_in: null } };
    }

    const code = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);
    const jti = randomBytes(8).toString('hex');

    const resetSecret  = this.config.get<string>('JWT_RESET_SECRET')   || 'dev-reset-secret';
    const resetExpires = this.config.get<string>('JWT_RESET_EXPIRES')  || '15m';

    const token = await this.jwt.signAsync(
      { sub: user.id, email: user.email, typ: 'reset', jti, codeHash },
      { secret: resetSecret, expiresIn: resetExpires },
    );

    const subject = 'SIGCOM — Réinitialisation du mot de passe / Password reset';
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

    return { data: { token, expires_in: resetExpires } };
  }

  // ===== Étape 2 — RESET =====
  async resetPassword(dto: ResetPasswordDto) {
    const resetSecret = this.config.get<string>('JWT_RESET_SECRET') || 'dev-reset-secret';

    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(dto.token, { secret: resetSecret });
    } catch {
      throw new BadRequestException({
        message: 'Token de réinitialisation invalide ou expiré.',
        messageE: 'Reset token invalid or expired.',
      });
    }

    if (payload?.typ !== 'reset' || !payload?.sub || !payload?.codeHash) {
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

    const hash = await bcrypt.hash(dto.new_password, 10);

    await this.prisma.utilisateur.update({
      where: { id: Number(payload.sub) },
      data: { mot_de_passe: hash },
    });
  }

  // ===== CHANGE PASSWORD (authentifié) =====
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nom: true, mot_de_passe: true, is_block: true },
    });
    if (!user) {
      throw new UnauthorizedException({
        message: 'Utilisateur introuvable.',
        messageE: 'User not found.',
      });
    }
    if (user.is_block) {
      throw new UnauthorizedException({
        message: 'Compte bloqué.',
        messageE: 'Account blocked.',
      });
    }

    const ok = await bcrypt.compare(dto.old_password, user.mot_de_passe);
    if (!ok) {
      throw new BadRequestException({
        message: 'Ancien mot de passe incorrect.',
        messageE: 'Old password is incorrect.',
      });
    }

    const newHash = await bcrypt.hash(dto.new_password, 10);
    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: { mot_de_passe: newHash },
    });
  }
}
