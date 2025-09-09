import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Retourne l’unique Setting, en le créant si nécessaire (id=1). */
  async getOne() {
    const existing = await this.prisma.setting.findFirst();
    if (existing) return existing;
    return this.prisma.setting.create({
      data: { id: 1, centralServerUrl: null },
    });
  }

  /** Create si rien n’existe, sinon update → upsert (toujours id=1). */
  async createOrUpdate(dto: CreateSettingDto) {
    return this.prisma.setting.upsert({
      where: { id: 1 },
      update: { centralServerUrl: dto.centralServerUrl ?? null },
      create: { id: 1, centralServerUrl: dto.centralServerUrl ?? null },
    });
  }

  /** Update de l’unique ligne (assure l’existence d’abord). */
  async update(dto: UpdateSettingDto) {
    await this.getOne(); // garantit la présence
    return this.prisma.setting.update({
      where: { id: 1 },
      data: { centralServerUrl: dto.centralServerUrl ?? null },
    });
  }
}
