import { Module } from '@nestjs/common';
import { SousDomainesService } from './sousdomaines.service';
import { SousDomainesController } from './sousdomaines.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule,AuthModule],
  controllers: [SousDomainesController],
  providers: [SousDomainesService],
})
export class SousDomainesModule {}
