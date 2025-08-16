import { Module } from '@nestjs/common';
import { DepartementsService } from './departements.service';
import { DepartementsController } from './departements.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DepartementsController],
  providers: [DepartementsService],
})
export class DepartementsModule {}
