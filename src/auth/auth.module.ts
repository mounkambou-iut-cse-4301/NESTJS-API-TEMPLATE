import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from '../utils/email.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { NotBlockedGuard } from './guards/not-blocked.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailService,
    JwtAuthGuard,
    NotBlockedGuard,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    NotBlockedGuard,
  ],
})
export class AuthModule {}