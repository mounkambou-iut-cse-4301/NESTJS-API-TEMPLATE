import { Module } from '@nestjs/common';
import { SyncGeoController } from './sync-geo.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
imports: [PrismaModule],  
  controllers: [SyncGeoController]
})
export class SyncGeoModule {}
