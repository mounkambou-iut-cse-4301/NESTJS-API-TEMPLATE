import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DomainesService } from './domaines.service';
import { ListDomainesQueryDto } from './dto/list-domaines.query.dto';
import { CreateDomaineDto } from './dto/create-domaine.dto';
import { UpdateDomaineDto } from './dto/update-domaine.dto';
import { DomaineIdParamDto } from './dto/domaine-id.param.dto';
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
@ApiTags('Domaines')
@Controller('api/v1/domaines')
export class DomainesController {
  constructor(private readonly service: DomainesService) {}

  @ApiOperation({ summary: 'Lister les domaines', description: 'Pagination + filtres q, code + tri.' })
  @Get()
  async list(@Query() q: ListDomainesQueryDto) {
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 100);
    const sort = sanitizeSort(q.sort, ['id','nom','code','created_at']);
    const { total, items } = await this.service.list({ page, pageSize, sort, q: q.q, code: q.code });
    return { message: 'Liste récupérée.', messageE: 'List retrieved.', data: items, meta: meta(page,pageSize,total) };
  }

  @ApiOperation({ summary: 'Créer un domaine' })
  @Post()
  async create(@Body() dto: CreateDomaineDto) {
    const row = await this.service.create(dto);
    return { message: 'Domaine créé.', messageE: 'Domain created.', data: row };
  }

  @ApiOperation({ summary: 'Détail d’un domaine' })
  @Get(':id')
  async one(@Param() p: DomaineIdParamDto) {
    const row = await this.service.findOne(p.id);
    return { message: 'Domaine récupéré.', messageE: 'Domain fetched.', data: row };
  }

  @ApiOperation({ summary: 'Mettre à jour un domaine' })
  @Patch(':id')
  async update(@Param() p: DomaineIdParamDto, @Body() dto: UpdateDomaineDto) {
    const row = await this.service.update(p.id, dto);
    return { message: 'Domaine mis à jour.', messageE: 'Domain updated.', data: row };
  }

  @ApiOperation({ summary: 'Supprimer un domaine', description: 'Refus si référencé.' })
  @Delete(':id')
  async remove(@Param() p: DomaineIdParamDto) {
    await this.service.remove(p.id);
    return { message: 'Domaine supprimé.', messageE: 'Domain deleted.' };
  }
}
