import { Module } from '@nestjs/common';
import { SousDomainesService } from './sousdomaines.service';
import { SousDomainesController } from './sousdomaines.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SousDomainesController],
  providers: [SousDomainesService],
})
export class SousDomainesModule {}
