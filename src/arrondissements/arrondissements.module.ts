import { Module } from '@nestjs/common';
import { ArrondissementsService } from './arrondissements.service';
import { ArrondissementsController } from './arrondissements.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ArrondissementsController],
  providers: [ArrondissementsService],
})
export class ArrondissementsModule {}
