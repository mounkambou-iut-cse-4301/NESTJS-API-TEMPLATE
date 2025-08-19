import { Module } from '@nestjs/common';
import { ParcoursController } from './parcours.controller';
import { ParcoursService } from './parcours.service';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [AuthModule,PrismaModule],
  controllers: [ParcoursController],
  providers: [ParcoursService,PrismaService]
})
export class ParcoursModule {}
