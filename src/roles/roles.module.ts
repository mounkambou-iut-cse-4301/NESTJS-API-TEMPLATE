// src/roles/roles.module.ts
import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule], // Import AuthModule to use its services like JwtService
  controllers: [RolesController],
  providers: [RolesService, PrismaService, AuthModule],
  exports: [RolesService],
})
export class RolesModule {}
