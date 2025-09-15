// src/sync-types/sync-types.controller.ts (CENTRAL)
import { Controller, Get /*, UseGuards */ } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags } from '@nestjs/swagger';
// import { SyncGuard } from '../auth/sync.guard'; // optionnel

@ApiTags('sync/types')
@Controller('sync/types')
// @UseGuards(SyncGuard) // JWT/IP allow-list si besoin
export class SyncTypesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('all')
  async all() {
    const rows = await this.prisma.typeInfrastructure.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        location: true,
        images: true,
        attribus: true,
        composant: true, // tableau d'IDs (ou vide)
        domaineId: true,
        sousdomaineId: true,
        competenceId: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Normalisation douce: arrays & objets
    const items = rows.map((r) => ({
      ...r,
      location: r.location && typeof r.location === 'object' && !Array.isArray(r.location) ? r.location : {},
      images: Array.isArray(r.images) ? r.images : [],
      attribus: Array.isArray(r.attribus) ? r.attribus : [],
      composant: Array.isArray(r.composant) ? r.composant : [],
    }));

    return { generatedAt: new Date().toISOString(), items };
  }
}
