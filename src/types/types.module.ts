import { Module } from '@nestjs/common';
import { TypesService } from './types.service';
import { TypesController } from './types.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DomainesModule } from 'src/domaines/domaines.module';
import { SousDomainesModule } from 'src/sousdomaines/sousdomaines.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule,DomainesModule,
    SousDomainesModule,
    TypesModule,AuthModule],
  controllers: [TypesController],
  providers: [TypesService],
})
export class TypesModule {}
