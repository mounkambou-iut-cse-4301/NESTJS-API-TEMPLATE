
// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { PrismaClient } from '@prisma/client';

// @Injectable()
// export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
//   constructor(private readonly config: ConfigService) {
//     super({
//       datasources: {
//         db: {
//           // fallback .env direct si ConfigService n’a rien
//           url: config.get<string>('DATABASE_URL') || process.env.DATABASE_URL,
//         },
//       },
//       // Active uniquement les logs utiles (évite le bruit)
//       log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
//       errorFormat: 'minimal',
//     });
//   }

//   async onModuleInit() {
//     await this.$connect();
//   }

//   async onModuleDestroy() {
//     await this.$disconnect();
//   }
// }

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly config: ConfigService) {
    super({
      datasources: {
        db: {
          // fallback .env direct si ConfigService n’a rien
          url: config.get<string>('DATABASE_URL') || process.env.DATABASE_URL,
        },
      },
      // mêmes logs que ton code, avec un poil de signal
      log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
      errorFormat: 'minimal',
    });

    // Relay Prisma -> Nest logger
    (this as any).$on('warn', (e: any) => this.logger.warn(e));
    (this as any).$on('error', (e: any) => this.logger.error(e));
  }

  private async connectWithRetry() {
    const attempts  = Number(this.config.get('PRISMA_RETRY_ATTEMPTS') ?? 20);
    const baseDelay = Number(this.config.get('PRISMA_RETRY_BASE_DELAY_MS') ?? 1000);
    const maxDelay  = Number(this.config.get('PRISMA_RETRY_MAX_DELAY_MS') ?? 30000);

    for (let i = 1; i <= attempts; i++) {
      try {
        this.logger.log(`Prisma: tentative de connexion ${i}/${attempts}…`);
        await this.$connect();
        this.logger.log('Prisma: connecté ✅');
        return;
      } catch (err: any) {
        this.logger.error(`Prisma: échec tentative ${i}/${attempts}: ${err?.message ?? err}`);
        if (i === attempts) throw err;
        const delay = Math.min(baseDelay * 2 ** (i - 1), maxDelay) + Math.floor(Math.random() * 500);
        this.logger.log(`Nouvel essai dans ${delay}ms…`);
        await sleep(delay);
      }
    }
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

