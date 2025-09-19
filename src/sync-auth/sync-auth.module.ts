// src/sync-auth-central/sync-auth-central.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { SyncAuthController } from './sync-auth.controller';

@Module({
  imports: [PrismaModule],
  providers: [PrismaService],
  controllers: [SyncAuthController],
})
export class SyncAuthCentralModule {}
