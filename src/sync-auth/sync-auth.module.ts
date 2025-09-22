// src/sync-auth-central/sync-auth-central.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { SyncAuthController } from './sync-auth.controller';
import { SettingsService } from 'src/settings/settings.service';

@Module({
  imports: [PrismaModule],
  providers: [PrismaService, SettingsService],
  controllers: [SyncAuthController],
})
export class SyncAuthCentralModule {}
