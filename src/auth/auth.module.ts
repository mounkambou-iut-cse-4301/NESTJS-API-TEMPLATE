// src/auth/auth.module.ts
import { Global, Module } from '@nestjs/common'; // Add Global import
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config'; // Add this
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { NotBlockedGuard } from './guards/not-blocked.guard';
import { EmailService } from '../utils/email.service';

@Global() // Add this decorator
@Module({
  imports: [
    ConfigModule,           // Add this to provide ConfigService globally
    PrismaModule, 
    JwtModule.register({})
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService, JwtAuthGuard, NotBlockedGuard],
  exports: [AuthService, JwtAuthGuard, NotBlockedGuard, JwtModule],
})
export class AuthModule {}