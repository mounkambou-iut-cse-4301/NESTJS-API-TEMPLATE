import { Module } from '@nestjs/common';
import { TypesService } from './types.service';
import { TypesController } from './types.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DomainesModule } from 'src/domaines/domaines.module';
import { SousDomainesModule } from 'src/sousdomaines/sousdomaines.module';

@Module({
  imports: [PrismaModule,DomainesModule,
    SousDomainesModule,
    TypesModule,],
  controllers: [TypesController],
  providers: [TypesService],
})
export class TypesModule {}
