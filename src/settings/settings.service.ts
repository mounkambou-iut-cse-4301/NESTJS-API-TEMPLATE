import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { TypeCommission } from '@prisma/client';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapSetting(setting: any) {
    return {
      id: setting.id,
      commission_domicile: setting.commission_domicile,
      commission_domicile_type: setting.commission_domicile_type,
      commission_institut: setting.commission_institut,
      commission_institut_type: setting.commission_institut_type,
      created_at: setting.created_at.toISOString(),
      updated_at: setting.updated_at.toISOString(),
    };
  }

  async getOne() {
    const existing = await this.prisma.setting.findUnique({
      where: { id: 1 },
    });

    if (existing) {
      return this.mapSetting(existing);
    }

    const created = await this.prisma.setting.create({
      data: {
        id: 1,
        commission_domicile: 0,
        commission_domicile_type: TypeCommission.POURCENTAGE,
        commission_institut: 0,
        commission_institut_type: TypeCommission.POURCENTAGE,
      },
    });

    return this.mapSetting(created);
  }

  async createOrUpdate(dto: CreateSettingDto | UpdateSettingDto) {
    const setting = await this.prisma.setting.upsert({
      where: { id: 1 },
      update: {
        commission_domicile: dto.commission_domicile,
        commission_domicile_type: dto.commission_domicile_type,
        commission_institut: dto.commission_institut,
        commission_institut_type: dto.commission_institut_type,
      },
      create: {
        id: 1,
        commission_domicile: dto.commission_domicile ?? 0,
        commission_domicile_type:
          dto.commission_domicile_type ?? TypeCommission.POURCENTAGE,
        commission_institut: dto.commission_institut ?? 0,
        commission_institut_type:
          dto.commission_institut_type ?? TypeCommission.POURCENTAGE,
      },
    });

    return this.mapSetting(setting);
  }

  async update(dto: UpdateSettingDto) {
    await this.getOne();

    const setting = await this.prisma.setting.update({
      where: { id: 1 },
      data: {
        commission_domicile: dto.commission_domicile,
        commission_domicile_type: dto.commission_domicile_type,
        commission_institut: dto.commission_institut,
        commission_institut_type: dto.commission_institut_type,
      },
    });

    return this.mapSetting(setting);
  }
}