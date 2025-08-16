import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InfrastructuresController } from './infrastructures.controller';
import { InfrastructuresService } from './infrastructures.service';

@Module({
  imports: [PrismaModule],
  controllers: [InfrastructuresController],
  providers: [InfrastructuresService],
})
export class InfrastructuresModule {}
