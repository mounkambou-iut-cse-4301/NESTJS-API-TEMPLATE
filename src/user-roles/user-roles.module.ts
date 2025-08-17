// src/user-roles/user-roles.module.ts
import { Module } from '@nestjs/common';
import { UserRolesController } from './user-roles.controller';
import { UserRolesService } from './user-roles.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [UserRolesController],
  providers: [UserRolesService, PrismaService],
})
export class UserRolesModule {}
