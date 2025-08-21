import { Module } from '@nestjs/common';
import { ExportsService } from './exports.service';
import { ExportsController } from './exports.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';

@Module( { 
  imports: [AuthModule],
  controllers: [ExportsController],
  providers: [ExportsService, PrismaService],
  exports: [ExportsService],
})
export class ExportsModule {}
