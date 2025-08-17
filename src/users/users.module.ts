// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // ✅
import { EmailService } from 'src/utils/email.service';

@Module({
  imports: [PrismaModule, AuthModule], // ✅ nécessaire pour résoudre JwtService via AuthModule
  controllers: [UsersController],
  providers: [UsersService,EmailService],           // ❌ ne pas mettre JwtAuthGuard ici
  exports: [UsersService],
})
export class UsersModule {}
