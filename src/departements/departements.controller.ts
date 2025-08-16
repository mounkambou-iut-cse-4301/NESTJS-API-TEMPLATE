import { Controller, Get, Post, Body, Query, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DepartementsService } from './departements.service';
import { ListDepartementsQueryDto } from './dto/list-departements.query.dto';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';
import { DepartementIdParamDto } from './dto/departement-id.param.dto';

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

@ApiTags('Departements')
@Controller('api/v1/departements')
export class DepartementsController {
  constructor(private readonly service: DepartementsService) {}

  @ApiOperation({ summary: 'Lister les départements', description: 'Liste paginée avec filtres (q, code, regionId) et tri sur id, nom, nom_en, code.' })
  @Get()
  async list(@Query() q: ListDepartementsQueryDto) {
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 100);
    const sort = sanitizeSort(q.sort, ['id','nom','nom_en','code']);
    const { total, items } = await this.service.list({ page, pageSize, sort, q: q.q, regionId: q.regionId, code: q.code });
    return { message: 'Liste des départements récupérée.', messageE: 'Departments list retrieved.', data: items, meta: buildMeta(page, pageSize, total) };
  }

  @ApiOperation({ summary: 'Créer un département', description: 'Création d’un département rattaché à une région.' })
  @Post()
  async create(@Body() dto: CreateDepartementDto) {
    const created = await this.service.create(dto);
    return { message: 'Département créé avec succès.', messageE: 'Department created successfully.', data: created };
  }

  @ApiOperation({ summary: 'Détail département', description: 'Récupérer un département par son id.' })
  @Get(':id')
  async getOne(@Param() p: DepartementIdParamDto) {
    const row = await this.service.findOne(p.id);
    return { message: 'Département récupéré.', messageE: 'Department fetched.', data: row };
  }

  @ApiOperation({ summary: 'Mettre à jour un département', description: 'Mise à jour partielle: nom, nom_en, code, regionId.' })
  @Patch(':id')
  async update(@Param() p: DepartementIdParamDto, @Body() dto: UpdateDepartementDto) {
    const row = await this.service.update(p.id, dto);
    return { message: 'Département mis à jour.', messageE: 'Department updated.', data: row };
  }
}
