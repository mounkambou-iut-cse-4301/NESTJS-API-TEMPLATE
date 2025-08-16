import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { EmailService } from 'src/utils/email.service';
import { PrismaModule } from 'src/prisma/prisma.module';
// EmailService est dans utils/cloudinary.ts (comme tu l'as écrit)

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, EmailService],
  exports: [UsersService],
})
export class UsersModule {}
