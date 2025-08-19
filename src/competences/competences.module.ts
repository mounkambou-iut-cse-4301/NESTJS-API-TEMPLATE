import { Module } from '@nestjs/common';
import { CompetencesController } from './competences.controller';
import { CompetencesService } from './competences.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [AuthModule,PrismaModule],
  controllers: [CompetencesController],
  providers: [CompetencesService],
  exports: [CompetencesService],
})
export class CompetencesModule {}
