import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  private normalizePhone(phone?: string): string {
    return (phone || '').trim();
  }

  private normalizeEmail(email?: string): string {
    return (email || '').trim().toLowerCase();
  }

  private getFullName(user: { firstName: string; lastName: string }): string {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }

  /**
   * Construit les rôles et permissions de l'utilisateur connecté.
   *
   * Nouveau schéma :
   * - Role.name
   * - Permission.code
   * - PermissionRole
   * - UtilisateurRole
   */
  private async buildRolesAndPermissions(userId: number) {
    const userRoles = await this.prisma.utilisateurRole.findMany({
      where: { utilisateurId: userId },
      include: {
        role: true,
      },
    });

    const roles = userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
    }));

    const roleIds = userRoles.map((ur) => ur.roleId);

    const isSuperAdmin = roles.some((role) =>
      ['SUPERADMIN', 'SUPER_ADMIN'].includes(role.name),
    );

    let permissions: string[] = [];

    if (isSuperAdmin) {
      const allPermissions = await this.prisma.permission.findMany({
        select: {
          code: true,
        },
      });

      permissions = allPermissions.map((permission) => permission.code);
    } else if (roleIds.length > 0) {
      const permissionRoles = await this.prisma.permissionRole.findMany({
        where: {
          roleId: {
            in: roleIds,
          },
        },
        include: {
          permission: true,
        },
      });

      permissions = Array.from(
        new Set(permissionRoles.map((pr) => pr.permission.code)),
      );
    }

    return {
      roles,
      permissions,
    };
  }

  /**
   * Incrémente les tentatives échouées.
   * À partir de 5 tentatives, le compte est bloqué.
   */
  private async incrementFailedAttempts(userId: number) {
    const user = await this.prisma.utilisateur.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        loginAttempt: true,
        isBlock: true,
      },
    });

    if (!user || user.isBlock) {
      return;
    }

    const nextAttempts = (user.loginAttempt || 0) + 1;
    const shouldBlock = nextAttempts >= 5;

    await this.prisma.utilisateur.update({
      where: {
        id: user.id,
      },
      data: {
        loginAttempt: nextAttempts,
        isBlock: shouldBlock,
      },
    });

    if (shouldBlock) {
      throw new ForbiddenException({
        message: 'Compte bloqué après 5 tentatives de connexion échouées.',
        messageE: 'Account blocked after 5 failed login attempts.',
      });
    }
  }

  /**
   * LOGIN
   *
   * Ton nouveau schéma n'a plus TypeUtilisateur.
   * Donc la connexion se fait simplement avec :
   * - telephone
   * - mot_de_passe
   */
  async login(dto: LoginDto) {
    const phone = this.normalizePhone(dto.telephone);

    if (!phone) {
      throw new BadRequestException({
        message: 'Le numéro de téléphone est obligatoire.',
        messageE: 'Phone number is required.',
      });
    }

    const user = await this.prisma.utilisateur.findUnique({
      where: {
        phone,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        password: true,
        picture: true,
        isVerified: true,
        isBlock: true,
        isDeleted: true,
        loginAttempt: true,
      },
    });

    if (!user || user.isDeleted) {
      throw new UnauthorizedException({
        message: 'Identifiants invalides.',
        messageE: 'Invalid credentials.',
      });
    }

    if (user.isBlock) {
      throw new ForbiddenException({
        message: 'Votre compte est bloqué.',
        messageE: 'Your account is blocked.',
      });
    }

    const passwordOk = await bcrypt.compare(dto.mot_de_passe, user.password);

    if (!passwordOk) {
      await this.incrementFailedAttempts(user.id);

      throw new UnauthorizedException({
        message: 'Identifiants invalides.',
        messageE: 'Invalid credentials.',
      });
    }

    await this.prisma.utilisateur.update({
      where: {
        id: user.id,
      },
      data: {
        loginAttempt: 0,
      },
    });

    const { roles, permissions } = await this.buildRolesAndPermissions(user.id);

    const payloadUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: this.getFullName(user),
      email: user.email,
      phone: user.phone,
      picture: user.picture,
      isVerified: user.isVerified,
      isBlock: user.isBlock,
    };

    const payload = {
      sub: user.id,
      user: payloadUser,
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
      user: payloadUser,
      roles,
      permissions,
    };
  }

  /**
   * Construit la condition de recherche pour mot de passe oublié.
   * On recherche par email ou téléphone.
   */
  private buildForgotWhere(dto: ForgotPasswordDto): Prisma.UtilisateurWhereInput {
    const or: Prisma.UtilisateurWhereInput[] = [];

    if (dto.telephone?.trim()) {
      or.push({
        phone: this.normalizePhone(dto.telephone),
      });
    }

    if (dto.email?.trim()) {
      or.push({
        email: {
          equals: this.normalizeEmail(dto.email),
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
      isDeleted: false,
      ...(or.length === 1 ? or[0] : { OR: or }),
    };
  }

  /**
   * FORGOT PASSWORD
   *
   * Réponse neutre pour éviter de révéler si un compte existe ou non.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const where = this.buildForgotWhere(dto);

    const user = await this.prisma.utilisateur.findFirst({
      where,
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isBlock: true,
        isDeleted: true,
      },
    });

    const neutralResponse = {
      message:
        'Si le compte existe, les informations de réinitialisation ont été générées.',
      messageE: 'If the account exists, reset information has been generated.',
      data: {
        token: null as string | null,
        expires_in: null as string | null,
      },
    };

    if (!user || user.isDeleted) {
      return neutralResponse;
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
        email: user.email,
        phone: user.phone,
        codeHash,
      },
      {
        secret: resetSecret,
        expiresIn: resetExpires,
      },
    );

    if (user.email) {
      const fullName = this.getFullName(user);

      const subject =
        'Réinitialisation du mot de passe / Password reset';

      const message =
        `Bonjour ${fullName},\n\n` +
        `Code de vérification : ${code}\n` +
        `Token de réinitialisation :\n${token}\n\n` +
        `Expire dans ${resetExpires}.\n\n` +
        `---\n` +
        `Hello ${fullName},\n\n` +
        `Verification code: ${code}\n` +
        `Reset token:\n${token}\n\n` +
        `Expires in ${resetExpires}.\n`;

      await this.email.sendEmail(subject, message, user.email);
    }

    return {
      message:
        'Si le compte existe, les informations de réinitialisation ont été générées.',
      messageE: 'If the account exists, reset information has been generated.',
      data: {
        token,
        expires_in: resetExpires,
      },
    };
  }

  /**
   * RESET PASSWORD
   *
   * Après reset réussi :
   * - password hashé
   * - loginAttempt remis à 0
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

    const user = await this.prisma.utilisateur.findUnique({
      where: {
        id: Number(payload.sub),
      },
      select: {
        id: true,
        isDeleted: true,
      },
    });

    if (!user || user.isDeleted) {
      throw new BadRequestException({
        message: 'Utilisateur introuvable.',
        messageE: 'User not found.',
      });
    }

    const newHash = await bcrypt.hash(dto.new_password, 10);

    await this.prisma.utilisateur.update({
      where: {
        id: user.id,
      },
      data: {
        password: newHash,
        loginAttempt: 0,
        isBlock: false,
      },
    });

    return {
      message: 'Mot de passe réinitialisé avec succès.',
      messageE: 'Password reset successfully.',
    };
  }

  /**
   * CHANGE PASSWORD
   *
   * Utilisateur connecté.
   */
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.utilisateur.findUnique({
      where: {
        id: Number(userId),
      },
      select: {
        id: true,
        password: true,
        isBlock: true,
        isDeleted: true,
      },
    });

    if (!user || user.isDeleted) {
      throw new UnauthorizedException({
        message: 'Utilisateur introuvable.',
        messageE: 'User not found.',
      });
    }

    if (user.isBlock) {
      throw new ForbiddenException({
        message: 'Votre compte est bloqué.',
        messageE: 'Your account is blocked.',
      });
    }

    const oldPasswordOk = await bcrypt.compare(
      dto.old_password,
      user.password,
    );

    if (!oldPasswordOk) {
      throw new BadRequestException({
        message: 'Ancien mot de passe incorrect.',
        messageE: 'Old password is incorrect.',
      });
    }

    const newHash = await bcrypt.hash(dto.new_password, 10);

    await this.prisma.utilisateur.update({
      where: {
        id: user.id,
      },
      data: {
        password: newHash,
        loginAttempt: 0,
      },
    });

    return {
      message: 'Mot de passe modifié avec succès.',
      messageE: 'Password changed successfully.',
    };
  }
}