// src/auth/auth.controller.ts
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { NotBlockedGuard } from './guards/not-blocked.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

    @Post('login')
  @ApiOperation({
    summary: 'Connexion : email + mot de passe → JWT signé (payload lisible : user, rôles, permissions).',
    description: `Vérifie les identifiants, refuse si le compte est bloqué. Le JWT est signé avec JWT_SECRET (pas chiffré).`,
  })
  async login(@Body() dto: LoginDto) {
    return await this.service.login(dto);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Mot de passe oublié — Étape 1 : envoi du code + token',
    description:
      "Envoie ton email. Si le compte existe, on envoie **un code à 6 chiffres** et **un token de réinitialisation** (JWT de courte durée) par email.",
  })
  async forgot(@Body() dto: ForgotPasswordDto) {
    const res = await this.service.forgotPassword(dto);
    return {
      message: 'Si le compte existe, un email a été envoyé.',
      messageE: 'If the account exists, an email has been sent.',
      ...res, // { data: { token, expires_in } }
    };
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Mot de passe oublié — Étape 2 : réinitialiser avec token + code',
    description:
      "Fournis **token**, **code** reçu par email, et **nouveau mot de passe**. Aucun ancien mot de passe n’est requis.",
  })
  async reset(@Body() dto: ResetPasswordDto) {
    await this.service.resetPassword(dto);
    return {
      message: 'Mot de passe réinitialisé avec succès.',
      messageE: 'Password successfully reset.',
    };
  }

   @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, NotBlockedGuard)
  @Post('change-password')
  @UseGuards(JwtAuthGuard, NotBlockedGuard) // protège pour l’utilisateur connecté
  @ApiOperation({
    summary: 'Changer son mot de passe (authentifié)',
    description:
      "Endpoint protégé. Fournis **ancien mot de passe** et **nouveau mot de passe**. Si l’ancien est correct, on remplace par le nouveau.",
  })
  async change(@Req() req: any, @Body() dto: ChangePasswordDto) {
    await this.service.changePassword(req.user.id, dto);
    return {
      message: 'Mot de passe modifié avec succès.',
      messageE: 'Password changed successfully.',
    };
  }
}
