// src/portails/portails.controller.ts
import {
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PortailsService } from './portails.service';
import {
  PageQueryDto,
  InfraListQueryDto,
  ExportQueryDto,
  SummaryQueryDto,
  TypesBreakdownQueryDto,
} from './dto/query.dto';

@ApiTags('Portails (public)')
@Controller('api/public/portails')
export class PortailsController {
  constructor(private readonly service: PortailsService) {}

  /* 1) Tous les types d’infrastructure */
  @Get('types')
  @ApiOperation({ summary: 'Lister tous les types d’infrastructure (public)' })
  async types() {
    return this.service.getAllTypes();
  }

  /* 1-bis) Infrastructures publiques (pagination + filtres) */
  @Get('infrastructures')
  @ApiOperation({
    summary: 'Lister les infrastructures publiques (pagination + filtres)',
    description:
      'Colonnes: Nom, Type, Commune, Date de mise à jour, Responsable. Filtres: typeId, communeId, q (recherche).',
  })
  @ApiQuery({ name: 'typeId', required: false, type: Number })
  @ApiQuery({ name: 'communeId', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'q', required: false, type: String })
  async listInfras(@Query() q: InfraListQueryDto) {
    return this.service.listInfrasPublic(q);
  }

  /* 2) Export des infrastructures publiques */
  @Get('infrastructures/export')
  @ApiOperation({
    summary: 'Exporter les infrastructures (CSV/XLSX/PDF)',
    description:
      'Même colonnes que /infrastructures. Filtres: typeId, communeId. Param: format=csv|xlsx|pdf (csv par défaut).',
  })
  async exportInfras(@Query() q: ExportQueryDto, @Res() res: Response) {
    const { filename, mime, buffer } = await this.service.exportInfrasPublic(q);
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  /* 3) Indicateurs globaux (public) */
  @Get('summary')
  @ApiOperation({
    summary:
      'Résumé public: total, condition moyenne (%), dernière mise à jour (filtre facultatif par commune)',
  })
  @ApiQuery({ name: 'communeId', required: false, type: Number })
  async summary(@Query() q: SummaryQueryDto) {
    // Vérif rapide (en dev)
    // console.log('Received Query:', q);
    return this.service.summaryPublic(q);
  }

  /* 4) Lister les communes (pagination + q) */
  @Get('communes')
  @ApiOperation({ summary: 'Lister les communes (pagination + recherche)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'q', required: false, type: String })
  async listCommunes(@Query() q: PageQueryDto) {
    return this.service.listCommunes(q);
  }

  /* 5) Répartition par type (public) */
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
