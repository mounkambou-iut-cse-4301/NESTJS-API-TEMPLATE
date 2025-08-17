import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InfrastructuresController } from './infrastructures.controller';
import { InfrastructuresService } from './infrastructures.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [InfrastructuresController],
  providers: [InfrastructuresService],
})
export class InfrastructuresModule {}
