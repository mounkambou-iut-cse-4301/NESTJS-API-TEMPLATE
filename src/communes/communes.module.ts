import { Module } from '@nestjs/common';
import { CommunesService } from './communes.service';
import { CommunesController } from './communes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommunesController],
  providers: [CommunesService],
})
export class CommunesModule {}
