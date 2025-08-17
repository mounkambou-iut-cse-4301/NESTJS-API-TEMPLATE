// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { NotBlockedGuard } from './guards/not-blocked.guard';
import { EmailService } from '../utils/email.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}), // secret/exp gérés dans AuthService.verify/sign
  ],
  controllers: [AuthController],
  providers:    [AuthService, EmailService, JwtAuthGuard, NotBlockedGuard],
  exports:      [AuthService, JwtAuthGuard, NotBlockedGuard, JwtModule], // ✅ exporte JwtModule
})
export class AuthModule {}
