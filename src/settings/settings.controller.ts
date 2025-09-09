import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, NotBlockedGuard)
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

  @ApiOperation({ summary: 'Mettre à jour les paramètres' })
  @Patch()
  async update(@Body() dto: UpdateSettingDto) {
    const data = await this.service.update(dto);
    return { message: 'Paramètres mis à jour.', messageE: 'Settings updated.', data };
  }
}
