import { Controller, Get, Post, Body, Query, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ArrondissementsService } from './arrondissements.service';
import { ListArrondissementsQueryDto } from './dto/list-arrondissements.query.dto';
import { CreateArrondissementDto } from './dto/create-arrondissement.dto';
import { UpdateArrondissementDto } from './dto/update-arrondissement.dto';
import { ArrondissementIdParamDto } from './dto/arrondissement-id.param.dto';

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

@ApiTags('Arrondissements')
@Controller('api/v1/arrondissements')
export class ArrondissementsController {
  constructor(private readonly service: ArrondissementsService) {}

  @ApiOperation({ summary: 'Lister les arrondissements', description: 'Liste paginée avec filtres (q, code, departementId) et tri sur id, nom, nom_en, code.' })
  @Get()
  async list(@Query() q: ListArrondissementsQueryDto) {
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 100);
    const sort = sanitizeSort(q.sort, ['id','nom','nom_en','code']);
    const { total, items } = await this.service.list({ page, pageSize, sort, q: q.q, departementId: q.departementId, code: q.code });
    return { message: 'Liste des arrondissements récupérée.', messageE: 'Sub-divisions list retrieved.', data: items, meta: buildMeta(page, pageSize, total) };
  }

  @ApiOperation({ summary: 'Créer un arrondissement', description: 'Création d’un arrondissement rattaché à un département.' })
  @Post()
  async create(@Body() dto: CreateArrondissementDto) {
    const created = await this.service.create(dto);
    return { message: 'Arrondissement créé avec succès.', messageE: 'Sub-division created successfully.', data: created };
  }

  @ApiOperation({ summary: 'Détail arrondissement', description: 'Récupérer un arrondissement par son id.' })
  @Get(':id')
  async getOne(@Param() p: ArrondissementIdParamDto) {
    const row = await this.service.findOne(p.id);
    return { message: 'Arrondissement récupéré.', messageE: 'Sub-division fetched.', data: row };
  }

  @ApiOperation({ summary: 'Mettre à jour un arrondissement', description: 'Mise à jour partielle: nom, nom_en, code, departementId.' })
  @Patch(':id')
  async update(@Param() p: ArrondissementIdParamDto, @Body() dto: UpdateArrondissementDto) {
    const row = await this.service.update(p.id, dto);
    return { message: 'Arrondissement mis à jour.', messageE: 'Sub-division updated.', data: row };
  }
}
