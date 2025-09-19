import { Module } from '@nestjs/common';
import { SyncRefsController } from './sync-refs.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],  
  
  providers:[PrismaService],
  controllers: [SyncRefsController]
})
export class SyncRefsModule {}
