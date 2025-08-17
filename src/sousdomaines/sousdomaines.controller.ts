import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SousDomainesService } from './sousdomaines.service';
import { ListSousDomainesQueryDto } from './dto/list-sousdomaines.query.dto';
import { CreateSousDomaineDto } from './dto/create-sousdomaine.dto';
import { UpdateSousDomaineDto } from './dto/update-sousdomaine.dto';
import { SousDomaineIdParamDto } from './dto/sousdomaine-id.param.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';

function sanitizeSort(sort: string | undefined, allowed: string[]) {
  if (!sort) return undefined;
  const orders: Record<string,'asc'|'desc'> = {};
  for (const t of sort.split(',').map(s=>s.trim()).filter(Boolean)) {
    const desc = t.startsWith('-'); const key = desc ? t.slice(1) : t;
    if (allowed.includes(key)) orders[key] = desc ? 'desc' : 'asc';
  }
  return Object.keys(orders).length ? orders : undefined;
}
function meta(page:number, pageSize:number, total:number) {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total/Math.max(1,pageSize))) };
}
 @ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, NotBlockedGuard)
@ApiTags('SousDomaines')
@Controller('api/v1/sous-domaines')
export class SousDomainesController {
  constructor(private readonly service: SousDomainesService) {}

  @ApiOperation({ summary: 'Lister les sous-domaines', description: 'Pagination + filtres q, domaineId + tri.' })
  @Get()
  async list(@Query() q: ListSousDomainesQueryDto) {
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 100);
    const sort = sanitizeSort(q.sort, ['id','nom','code','created_at']);
    const { total, items } = await this.service.list({ page, pageSize, sort, q: q.q, domaineId: q.domaineId });
    return { message: 'Liste récupérée.', messageE: 'List retrieved.', data: items, meta: meta(page,pageSize,total) };
  }

  @ApiOperation({ summary: 'Créer un sous-domaine' })
  @Post()
  async create(@Body() dto: CreateSousDomaineDto) {
    const row = await this.service.create(dto);
    return { message: 'Sous-domaine créé.', messageE: 'Subdomain created.', data: row };
  }

  @ApiOperation({ summary: 'Détail d’un sous-domaine' })
  @Get(':id')
  async one(@Param() p: SousDomaineIdParamDto) {
    const row = await this.service.findOne(p.id);
    return { message: 'Sous-domaine récupéré.', messageE: 'Subdomain fetched.', data: row };
  }

  @ApiOperation({ summary: 'Mettre à jour un sous-domaine' })
  @Patch(':id')
  async update(@Param() p: SousDomaineIdParamDto, @Body() dto: UpdateSousDomaineDto) {
    const row = await this.service.update(p.id, dto);
    return { message: 'Sous-domaine mis à jour.', messageE: 'Subdomain updated.', data: row };
  }

  @ApiOperation({ summary: 'Supprimer un sous-domaine', description: 'Refus si référencé.' })
  @Delete(':id')
  async remove(@Param() p: SousDomaineIdParamDto) {
    await this.service.remove(p.id);
    return { message: 'Sous-domaine supprimé.', messageE: 'Subdomain deleted.' };
  }
}
