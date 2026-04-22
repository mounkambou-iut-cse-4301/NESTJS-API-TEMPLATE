import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';
import { UseGuards } from '@nestjs/common';
import {
  ErrorResponseDto,
  SettingResponseDto,
} from './dto/settings-response.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, NotBlockedGuard)
@ApiTags('Settings')
@Controller('api/v1/settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  @ApiOperation({
    summary: 'Récupérer les paramètres',
    description:
      'Retourne la ligne unique des paramètres. Si elle n’existe pas, elle est créée avec les valeurs par défaut du schéma.',
  })
  @ApiOkResponse({
    description: 'Paramètres récupérés',
    type: SettingResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Non authentifié',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Compte bloqué',
    type: ErrorResponseDto,
  })
  async getOne() {
    const data = await this.service.getOne();
    return {
      message: 'Paramètres récupérés.',
      messageE: 'Settings fetched.',
      data,
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Créer ou mettre à jour les paramètres',
    description:
      'Crée la ligne unique si elle n’existe pas, sinon la met à jour.',
  })
  @ApiOkResponse({
    description: 'Paramètres enregistrés',
    type: SettingResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Données invalides',
    type: ErrorResponseDto,
  })
  async create(@Body() dto: CreateSettingDto) {
    const data = await this.service.createOrUpdate(dto);
    return {
      message: 'Paramètres enregistrés.',
      messageE: 'Settings saved.',
      data,
    };
  }

  @Patch()
  @ApiOperation({
    summary: 'Mettre à jour les paramètres',
    description:
      'Met à jour les commissions et les types de commission.',
  })
  @ApiOkResponse({
    description: 'Paramètres mis à jour',
    type: SettingResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Données invalides',
    type: ErrorResponseDto,
  })
  async update(@Body() dto: UpdateSettingDto) {
    const data = await this.service.update(dto);
    return {
      message: 'Paramètres mis à jour.',
      messageE: 'Settings updated.',
      data,
    };
  }
}