import { Module } from '@nestjs/common';
import { PortailsController } from './portails.controller';
import { PortailsService } from './portails.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports:[PrismaModule],
  controllers: [PortailsController],
  providers: [PortailsService]
})
export class PortailsModule {}
