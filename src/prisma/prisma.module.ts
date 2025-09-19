// import { Global,Module } from '@nestjs/common';
// import { PrismaService } from './prisma.service';
// import { ConfigModule } from '@nestjs/config';

// @Module({
//   imports: [ConfigModule], 
//   providers: [PrismaService],
//   exports:[PrismaService]
// })
// export class PrismaModule {}
// src/prisma/prisma.module.ts
// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],  // une seule instance pour toute l'app
  exports: [PrismaService],
})
export class PrismaModule {}

