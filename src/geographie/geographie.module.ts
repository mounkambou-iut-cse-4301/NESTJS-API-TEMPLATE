import { Module } from '@nestjs/common';
import { GeographieController } from './geographie.controller';
import { GeographieService } from './geographie.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GeographieController],
  providers: [GeographieService],
  exports: [GeographieService],
})
export class GeographieModule {}