import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('sync/geo')
@Controller('sync/geo')
export class SyncGeoController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('commune/:communeId')
  async getCommuneBundle(@Param('communeId', ParseIntPipe) communeId: number) {
    const commune = await this.prisma.commune.findUnique({
      where: { id: communeId },
      include: {
        typeCommune: true,
        arrondissement: true,
        departement: true,
        region: true,
      },
    });

    // On renvoie un bundle minimal, bien ordonné
    if (!commune) {
      return { generatedAt: new Date().toISOString(), found: false, communeId };
    }

    return {
      generatedAt: new Date().toISOString(),
      found: true,
      payload: {
        region: commune.region,
        departement: commune.departement,
        arrondissement: commune.arrondissement, // peut être null
        typeCommune: commune.typeCommune,       // peut être null
        commune: {
          id: commune.id,
          nom: commune.nom,
          nom_en: commune.nom_en,
          nom_maire: commune.nom_maire,
          longitude: commune.longitude,
          latitude: commune.latitude,
          code: commune.code,
          communeUrl: commune.communeUrl,
          is_verified: commune.is_verified,
          is_block: commune.is_block,
          regionId: commune.regionId,
          departementId: commune.departementId,
          arrondissementId: commune.arrondissementId, // nullable
          typeCommuneId: commune.typeCommuneId,       // nullable
        },
      },
    };
  }
}
