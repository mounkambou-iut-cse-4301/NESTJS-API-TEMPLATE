import { Module } from '@nestjs/common';
import { TypeCommunesController } from './type-communes.controller';
import { TypeCommunesService } from './type-communes.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [AuthModule], // Import AuthModule to resolve JwtService
  
  controllers: [TypeCommunesController],
  providers: [TypeCommunesService, PrismaService],
  exports: [TypeCommunesService],
})
export class TypeCommunesModule {}
