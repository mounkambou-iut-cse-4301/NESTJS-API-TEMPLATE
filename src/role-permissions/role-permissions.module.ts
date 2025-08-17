// src/role-permissions/role-permissions.module.ts
import { Module } from '@nestjs/common';
import { RolePermissionsController } from './role-permissions.controller';
import { RolePermissionsService } from './role-permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [RolePermissionsController],
  providers: [RolePermissionsService, PrismaService],
  imports: [AuthModule],
})
export class RolePermissionsModule {}
