import { Controller, Get, Post, Body, Query, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { ListRegionsQueryDto } from './dto/list-regions.query.dto';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { RegionIdParamDto } from './dto/region-id.param.dto';

function sanitizeSort(sort: string | undefined, allowed: string[]) {
  if (!sort) return undefined;
  const orders: Record<string,'asc'|'desc'> = {};
  for (const token of sort.split(',').map(s => s.trim()).filter(Boolean)) {
    const desc = token.startsWith('-');
    const key = desc ? token.slice(1) : token;
    if (allowed.includes(key)) orders[key] = desc ? 'desc' : 'asc';
  }
  return Object.keys(orders).length ? orders : undefined;
}
function buildMeta(page: number, pageSize: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  return { page, pageSize, total, totalPages };
}

@ApiTags('Regions')
@Controller('api/v1/regions')
export class RegionsController {
  constructor(private readonly service: RegionsService) {}

  @ApiOperation({ summary: 'Lister les régions', description: 'Liste paginée des régions avec filtres (q, code) et tri autorisé sur id, nom, nom_en, code.' })
  @Get()
  async list(@Query() q: ListRegionsQueryDto) {
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 100);
    const sort = sanitizeSort(q.sort, ['id','nom','nom_en','code']);
    const { total, items } = await this.service.list({ page, pageSize, sort, q: q.q, code: q.code });
    return { message: 'Liste des régions récupérée.', messageE: 'Regions list retrieved.', data: items, meta: buildMeta(page, pageSize, total) };
  }

  @ApiOperation({ summary: 'Créer une région', description: 'Création d’une région. Les champs optionnels: nom_en, code.' })
  @Post()
  async create(@Body() dto: CreateRegionDto) {
    const created = await this.service.create(dto);
    return { message: 'Région créée avec succès.', messageE: 'Region created successfully.', data: created };
  }

  @ApiOperation({ summary: 'Détail région', description: 'Récupérer une région par son id.' })
  @Get(':id')
  async getOne(@Param() p: RegionIdParamDto) {
    const row = await this.service.findOne(p.id);
    return { message: 'Région récupérée.', messageE: 'Region fetched.', data: row };
  }

  @ApiOperation({ summary: 'Mettre à jour une région', description: 'Mise à jour partielle: nom, nom_en, code.' })
  @Patch(':id')
  async update(@Param() p: RegionIdParamDto, @Body() dto: UpdateRegionDto) {
    const row = await this.service.update(p.id, dto);
    return { message: 'Région mise à jour.', messageE: 'Region updated.', data: row };
  }
}
