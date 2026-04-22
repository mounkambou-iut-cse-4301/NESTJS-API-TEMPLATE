import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  ErrorResponseDto,
  ForgotPasswordResponseDto,
  GenericMessageResponseDto,
  LoginResponseDto,
} from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { NotBlockedGuard } from './guards/not-blocked.guard';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Connexion par téléphone, type et mot de passe',
    description:
      'Authentifie un utilisateur avec telephone + type + mot_de_passe et retourne un JWT avec user, rôles et permissions.',
  })
  @ApiOkResponse({
    description: 'Connexion réussie',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Identifiants invalides',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Compte bloqué',
    type: ErrorResponseDto,
  })
  async login(@Body() dto: LoginDto) {
    return await this.service.login(dto);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Mot de passe oublié',
    description:
      'Recherche un compte via type + (email ou téléphone), puis génère un token et un code de réinitialisation.',
  })
  @ApiOkResponse({
    description: 'Réinitialisation générée',
    type: ForgotPasswordResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Téléphone ou email requis',
    type: ErrorResponseDto,
  })
  async forgot(@Body() dto: ForgotPasswordDto) {
    return await this.service.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Réinitialiser le mot de passe',
    description:
      'Valide le token et le code, puis remplace le mot de passe hashé.',
  })
  @ApiOkResponse({
    description: 'Mot de passe réinitialisé',
    type: GenericMessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Token ou code invalide',
    type: ErrorResponseDto,
  })
  async reset(@Body() dto: ResetPasswordDto) {
    await this.service.resetPassword(dto);
    return {
      message: 'Mot de passe réinitialisé avec succès.',
      messageE: 'Password successfully reset.',
    };
  }

  @Post('change-password')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, NotBlockedGuard)
  @ApiOperation({
    summary: 'Changer son mot de passe',
    description:
      'Endpoint protégé. Vérifie l’ancien mot de passe puis enregistre le nouveau.',
  })
  @ApiOkResponse({
    description: 'Mot de passe modifié',
    type: GenericMessageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Ancien mot de passe incorrect',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Non authentifié',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Compte bloqué',
    type: ErrorResponseDto,
  })
  async change(@Req() req: any, @Body() dto: ChangePasswordDto) {
    await this.service.changePassword(req.user.id, dto);
    return {
      message: 'Mot de passe modifié avec succès.',
      messageE: 'Password changed successfully.',
    };
  }
}