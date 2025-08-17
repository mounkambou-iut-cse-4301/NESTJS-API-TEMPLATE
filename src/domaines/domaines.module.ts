import { Module } from '@nestjs/common';
import { DomainesService } from './domaines.service';
import { DomainesController } from './domaines.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule,AuthModule],
  controllers: [DomainesController],
  providers: [DomainesService],
})
export class DomainesModule {}
