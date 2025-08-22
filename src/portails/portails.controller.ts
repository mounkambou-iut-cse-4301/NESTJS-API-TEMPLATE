import {
  Controller,
  Get,
  Query,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PortailsService } from './portails.service';

class PageQueryDto {
  page?: number;
  pageSize?: number;
  q?: string;
}

class InfraListQueryDto extends PageQueryDto {
  typeId?: number;
  communeId?: number;
}

class ExportQueryDto {
  typeId?: number;
  communeId?: number;
  format?: 'csv' | 'xlsx' | 'pdf';
}

class SummaryQueryDto {
  communeId?: number;
}

class TypesBreakdownQueryDto {
  communeId?: number;
}

@ApiTags('Portails (public)')
@Controller('api/public/portails')
export class PortailsController {
  constructor(private readonly service: PortailsService) {}

  /* -------------------------------------------
   * 1) Tous les types d’infrastructure
   * ------------------------------------------- */
  @Get('types')
  @ApiOperation({ summary: 'Lister tous les types d’infrastructure (public)' })
  async types() {
    return this.service.getAllTypes();
  }

  /* -------------------------------------------
   * 1-bis) Infrastructures publiques (pagination + filtre type)
   * Champs: Nom, Type, Commune, Date de mise à jour, Responsable
   * ------------------------------------------- */
  @Get('infrastructures')
  @ApiOperation({
    summary: 'Lister les infrastructures publiques (pagination + filtre type)',
    description:
      'Colonnes: Nom, Type, Commune, Date de mise à jour, Responsable. Filtres: typeId, communeId, q (recherche).',
  })
  @ApiQuery({ name: 'typeId', required: false })
  @ApiQuery({ name: 'communeId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'q', required: false })
  async listInfras(@Query() q: InfraListQueryDto) {
    return this.service.listInfrasPublic(q);
  }

  /* -------------------------------------------
   * 2) Export des infrastructures publiques (filtre type/commune)
   * ------------------------------------------- */
  @Get('infrastructures/export')
  @ApiOperation({
    summary: 'Exporter les infrastructures (CSV/XLSX/PDF)',
    description:
      'Même jeu de colonnes que /infrastructures. Filtres: typeId, communeId. Param: format=csv|xlsx|pdf (csv par défaut).',
  })
  async exportInfras(@Query() q: ExportQueryDto, @Res() res: Response) {
    const { filename, mime, buffer } = await this.service.exportInfrasPublic(q);
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  /* -------------------------------------------
   * 3) Indicateurs globaux (public)
   * - total infrastructures
   * - condition moyenne (%) selon attribus.etat
   * - date dernière mise à jour
   * - filtre optionnel: communeId
   * ------------------------------------------- */
  @Get('summary')
  @ApiOperation({
    summary:
      'Résumé public: total, condition moyenne (%), dernière mise à jour (filtre facultatif par commune)',
  })
  @ApiQuery({ name: 'communeId', required: false, type: Number })
  async summary(@Query() q: SummaryQueryDto) {
    return this.service.summaryPublic(q);
  }

  /* -------------------------------------------
   * 4) Lister les communes (pagination + q)
   * ------------------------------------------- */
  @Get('communes')
  @ApiOperation({ summary: 'Lister les communes (pagination + recherche)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'q', required: false })
  async listCommunes(@Query() q: PageQueryDto) {
    return this.service.listCommunes(q);
  }

  /* -------------------------------------------
   * 5) Répartition par type (public)
   * - nombre total
   * - nombre par type + pourcentage
   * - filtre optionnel: communeId
   * ------------------------------------------- */
  @Get('stats/types-breakdown')
  @ApiOperation({
    summary:
      'Répartition publique par type: total + nombre par type + pourcentage (filtre facultatif par commune)',
  })
  @ApiQuery({ name: 'communeId', required: false, type: Number })
  async typesBreakdown(@Query() q: TypesBreakdownQueryDto) {
    return this.service.typesBreakdownPublic(q);
  }
}
