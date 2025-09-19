import { Module } from '@nestjs/common';
import { SyncTypesController } from './sync-types.controller';
import { SyncTypesService } from './sync-types.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],  
  
  controllers: [SyncTypesController],
  providers: [SyncTypesService,PrismaService]
})
export class SyncTypesModule {}
