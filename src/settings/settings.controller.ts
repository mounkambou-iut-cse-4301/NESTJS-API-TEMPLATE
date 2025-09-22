// import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
// import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
// import { SettingsService } from './settings.service';
// import { CreateSettingDto } from './dto/create-setting.dto';
// import { UpdateSettingDto } from './dto/update-setting.dto';
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
// import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';

// @ApiBearerAuth('JWT-auth')
// @UseGuards(JwtAuthGuard, NotBlockedGuard)
// @ApiTags('Settings')
// @Controller('api/v1/settings')
// export class SettingsController {
//   constructor(private readonly service: SettingsService) {}

//   @ApiOperation({ summary: 'Récupérer les paramètres (getOne, crée si absent)' })
//   @Get()
//   async getOne() {
//     const data = await this.service.getOne();
//     return { message: 'Paramètres récupérés.', messageE: 'Settings fetched.', data };
//   }

//   @ApiOperation({ summary: 'Créer si absent, sinon mettre à jour (upsert)' })
//   @Post()
//   async create(@Body() dto: CreateSettingDto) {
//     const data = await this.service.createOrUpdate(dto);
//     return { message: 'Paramètres enregistrés.', messageE: 'Settings saved.', data };
//   }

//   @ApiOperation({ summary: 'Mettre à jour les paramètres' })
//   @Patch()
//   async update(@Body() dto: UpdateSettingDto) {
//     const data = await this.service.update(dto);
//     return { message: 'Paramètres mis à jour.', messageE: 'Settings updated.', data };
//   }
// }
import { Body, Controller, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';
import { UpdateMaxActiveCommunesDto } from './dto/update-max-active-communes.dto';
import { ActiveCommunesQueryDto } from './dto/active-communes-query.dto';


@ApiTags('Settings')
@Controller('api/v1/settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @ApiOperation({ summary: 'Récupérer les paramètres (getOne, crée si absent)' })
  @Get()
  async getOne() {
    const data = await this.service.getOne();
    return { message: 'Paramètres récupérés.', messageE: 'Settings fetched.', data };
  }

  @ApiOperation({ summary: 'Créer si absent, sinon mettre à jour (upsert)' })
  @Post()
  async create(@Body() dto: CreateSettingDto) {
    const data = await this.service.createOrUpdate(dto);
    return { message: 'Paramètres enregistrés.', messageE: 'Settings saved.', data };
  }

  @ApiOperation({ summary: 'Mettre à jour les paramètres (centralServerUrl)' })
  @Patch()
  async update(@Body() dto: UpdateSettingDto) {
    const data = await this.service.update(dto);
    return { message: 'Paramètres mis à jour.', messageE: 'Settings updated.', data };
  }

  // ===== NOUVEAU 1/2 : update du plafond uniquement
  @ApiOperation({ summary: 'Mettre à jour uniquement le plafond de communes activables' })
  @Patch('max-active-communes')
  async updateMaxActive(@Body() dto: UpdateMaxActiveCommunesDto) {
    const data = await this.service.updateMaxActiveCommunes(dto.maxActiveCommunes);
    return {
      message: 'Plafond mis à jour.',
      messageE: 'Max active communes updated.',
      data,
    };
  }

  // ===== NOUVEAU 2/2 : total + liste paginée des communes actives
  @ApiOperation({ summary: 'Nombre total + liste paginée des communes avec is_verified=true' })
  @Get('active-communes')
  async getActiveCommunes(@Query() query: ActiveCommunesQueryDto) {
    const { page = 1, limit = 20 } = query;
    const data = await this.service.getActiveCommunesPaginated(page, limit);
    return {
      message: 'Communes actives récupérées.',
      messageE: 'Active communes fetched.',
      ...data,
    };
  }
}
