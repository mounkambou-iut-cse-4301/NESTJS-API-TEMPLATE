// src/sync-refs/sync-refs.controller.ts (CENTRAL)
import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags } from '@nestjs/swagger';
// import { SyncGuard } from '../auth/sync.guard'; // optionnel
@ApiTags('sync/refs')

@Controller('sync/refs')
// @UseGuards(SyncGuard) // JWT/IP allow-list si besoin
export class SyncRefsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('all')
  async all() {
    const [domaines, sousDomaines, competences] = await Promise.all([
      this.prisma.domaine.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.sousDomaine.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.competence.findMany({ orderBy: { id: 'asc' } }),
    ]);
    return { generatedAt: new Date().toISOString(), domaines, sousDomaines, competences };
  }
}
