// src/role-permissions/role-permissions.module.ts
import { Module } from '@nestjs/common';
import { RolePermissionsController } from './role-permissions.controller';
import { RolePermissionsService } from './role-permissions.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [RolePermissionsController],
  providers: [RolePermissionsService, PrismaService],
})
export class RolePermissionsModule {}
