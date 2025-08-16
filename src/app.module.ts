import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { RegionsModule } from './regions/regions.module';
import { DepartementsModule } from './departements/departements.module';
import { ArrondissementsModule } from './arrondissements/arrondissements.module';
import { CommunesModule } from './communes/communes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // rend ConfigService dispo partout
    PrismaModule,
    UsersModule,
    RegionsModule,
    DepartementsModule,
    ArrondissementsModule,
    CommunesModule,
  ],
})
export class AppModule {}
