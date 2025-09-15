import { Module } from '@nestjs/common';
import { SyncRefsController } from './sync-refs.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers:[PrismaService],
  controllers: [SyncRefsController]
})
export class SyncRefsModule {}
