import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { RegionsModule } from './regions/regions.module';
import { DepartementsModule } from './departements/departements.module';
import { ArrondissementsModule } from './arrondissements/arrondissements.module';
import { CommunesModule } from './communes/communes.module';
import { TypesModule } from './types/types.module';
import { DomainesModule } from './domaines/domaines.module';
import { SousDomainesModule } from './sousdomaines/sousdomaines.module';
import { InfrastructuresModule } from './infrastructures/infrastructures.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // rend ConfigService dispo partout
    PrismaModule,
    UsersModule,
    RegionsModule,
    DepartementsModule,
    ArrondissementsModule,
    CommunesModule,
    TypesModule,
    DomainesModule,
    SousDomainesModule,
    InfrastructuresModule,
  ],
})
export class AppModule {}
