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
    summary: 'Connexion par téléphone et mot de passe',
    description: `
      CONNEXION UTILISATEUR

      Cette API authentifie un utilisateur avec :
      - telephone
      - mot_de_passe

      RÉSULTAT :
      - token JWT
      - informations de l'utilisateur connecté
      - rôles
      - permissions

      IMPORTANT :
      - Après 5 tentatives échouées, le compte est bloqué.
      - Un compte bloqué ne peut plus se connecter.
    `,
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
    description: `
      MOT DE PASSE OUBLIÉ

      Cette API permet de générer un token et un code de réinitialisation.

      PARAMÈTRES :
      - telephone : optionnel si email fourni
      - email : optionnel si telephone fourni

      IMPORTANT :
      La réponse reste neutre pour éviter de révéler si le compte existe ou non.
    `,
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
    description: `
      RÉINITIALISATION DU MOT DE PASSE

      Cette API valide :
      - le token de réinitialisation
      - le code de vérification

      Ensuite, elle remplace le mot de passe par le nouveau mot de passe hashé.

      Après succès :
      - loginAttempt est remis à 0
      - le compte est débloqué
    `,
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
    return await this.service.resetPassword(dto);
  }

  @Post('change-password')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, NotBlockedGuard)
  @ApiOperation({
    summary: 'Changer son mot de passe',
    description: `
      CHANGEMENT DE MOT DE PASSE

      Endpoint protégé par JWT.

      Cette API :
      - vérifie l'ancien mot de passe
      - hash le nouveau mot de passe
      - met à jour le compte utilisateur

      CONDITIONS :
      - utilisateur authentifié
      - compte non bloqué
    `,
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
    return await this.service.changePassword(req.user.id, dto);
  }
}