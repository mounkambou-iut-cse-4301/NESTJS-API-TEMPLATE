// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { PrismaClient } from '@prisma/client';
// @Injectable()
// export class PrismaService extends PrismaClient {
//     constructor(configService:ConfigService){
//         super({
//             datasources:{
//                 db:{
//                     url:configService.get('DATABASE_URL')
//                 }
//             }
//         })
//     }
// }
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly config: ConfigService) {
    super({
      datasources: {
        db: {
          // fallback .env direct si ConfigService n’a rien
          url: config.get<string>('DATABASE_URL') || process.env.DATABASE_URL,
        },
      },
      // Active uniquement les logs utiles (évite le bruit)
      log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
      errorFormat: 'minimal',
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
