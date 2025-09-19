// src/user-roles/user-roles.module.ts
import { Module } from '@nestjs/common';
import { UserRolesController } from './user-roles.controller';
import { UserRolesService } from './user-roles.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [AuthModule,PrismaModule], // Import AuthModule to resolve JwtService
  controllers: [UserRolesController],
  providers: [UserRolesService],
})
export class UserRolesModule {}
