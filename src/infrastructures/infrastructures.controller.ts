import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { InfrastructuresService } from './infrastructures.service';
import { ListInfraQueryDto } from './dto/list-infra.query.dto';
import { CreateInfrastructureDto } from './dto/create-infra.dto';
import { UpdateInfrastructureDto } from './dto/update-infra.dto';
import { InfraIdParamDto } from './dto/infra-id.param.dto';
import { BulkInfraDto } from './dto/bulk.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';

function meta(page:number, pageSize:number, total:number) {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total/Math.max(1,pageSize))) };
}
function sanitizeSort(sort?: string) {
  if (!sort) return undefined;
  const orders: Record<string,'asc'|'desc'> = {};
  for (const t of sort.split(',').map(s=>s.trim()).filter(Boolean)) {
    const desc = t.startsWith('-'); const key = desc ? t.slice(1) : t;
    if (['created_at','name','type'].includes(key)) orders[key] = desc ? 'desc' : 'asc';
  }
  return Object.keys(orders).length ? orders : undefined;
}
 @ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, NotBlockedGuard)
@ApiTags('Infrastructures')
@Controller('api/v1/infrastructures')
export class InfrastructuresController {
  constructor(private readonly service: InfrastructuresService) {}

  @ApiOperation({
    summary: 'Lister les infrastructures',
    description: 'Pagination + filtres: regionId, departementId, arrondissementId, communeId, typeId, type, domaineId, sousdomaineId, q, created_from, created_to. Tri: created_at,name,type.',
  })
  @Get()
  async list(@Query() q: ListInfraQueryDto, @Req() req: any) {
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 200);
    const sort = sanitizeSort(q.sort);
    const { total, items } = await this.service.list({
      page, pageSize, sort,
      regionId: q.regionId, departementId: q.departementId, arrondissementId: q.arrondissementId, communeId: q.communeId,
      typeId: q.typeId, type: q.type, q: q.q, domaineId: q.domaineId, sousdomaineId: q.sousdomaineId, utilisateurId: q.utilisateurId,
      created_from: q.created_from, created_to: q.created_to,
        req, // pour le logging
    });
    return { message: 'Liste récupérée.', messageE: 'List retrieved.', data: items, meta: meta(page, pageSize, total) };
  }

  @ApiOperation({
    summary: 'Créer une infrastructure (record communal)',
    description: 'Crée le parent + duplique chaque composant en enfant (record) et répercute recordId dans le JSON parent.',
  })
  @Post()
async create(@Body() dto: CreateInfrastructureDto, @Req() req: any) {
  const res = await this.service.create(dto, req.sub); // 👈 fallback créateur
  return { message: 'Infrastructure créée.', messageE: 'Infrastructure created.', data: res };
}

  @ApiOperation({
    summary: 'Détail',
    description: 'Param `include=type,territory,composants` pour enrichir la réponse.',
  })
  @Get(':id')
  async one(@Param() p: InfraIdParamDto, @Query('include') include?: string) {
    const inc = (include || '').split(',').map(s=>s.trim()).filter(Boolean);
    const row = await this.service.findOne(p.id, inc);
    return { message: 'Infrastructure récupérée.', messageE: 'Infrastructure fetched.', data: row };
  }

  @ApiOperation({
    summary: 'Mettre à jour',
    description: 'Upsert des composants: crée si pas de recordId, met à jour si recordId présent.',
  })
  @Patch(':id')
  async update(@Param() p: InfraIdParamDto, @Body() dto: UpdateInfrastructureDto) {
    const row = await this.service.update(p.id, dto);
    return { message: 'Infrastructure mise à jour.', messageE: 'Infrastructure updated.', data: row };
  }

  @ApiOperation({
    summary: 'Supprimer',
    description: 'Supprime l’infrastructure et, si parent, aussi les enfants référencés dans composant[].recordId.',
  })
  @Delete(':id')
  async remove(@Param() p: InfraIdParamDto) {
    await this.service.remove(p.id);
    return { message: 'Infrastructure supprimée.', messageE: 'Infrastructure deleted.' };
  }

  @ApiOperation({
    summary: 'Bulk validate',
    description: 'Validation à blanc d’un tableau d’items (FK, champs requis).',
  })
  @Post('bulk/validate')
  async bulkValidate(@Body() body: BulkInfraDto) {
    const res = await this.service.validateBulk(body.items);
    return { message: 'Validation effectuée.', messageE: 'Validation done.', data: res };
  }

  @ApiOperation({
    summary: 'Bulk import',
    description: 'Crée en série les infrastructures (et leurs composants). Retourne id ou erreur par ligne.',
  })
  @Post('bulk')
async bulk(@Body() rows: CreateInfrastructureDto[], @Req() req: any) {
  const res = await this.service.bulk(rows, req.sub);  // 👈 fallback créateur
  return { message: 'Import traité.', messageE: 'Import processed.', data: res };
}

  @ApiOperation({
    summary: 'Export CSV',
    description: 'Même filtres que la liste. Retourne un CSV (UTF-8).',
  })
  @Get('export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async export(@Res() res: Response, @Query() q: ListInfraQueryDto) {
    const csv = await this.service.exportCsv({
      page: 1, pageSize: 100000, sort: sanitizeSort(q.sort),
      regionId: q.regionId, departementId: q.departementId, arrondissementId: q.arrondissementId, communeId: q.communeId,
      typeId: q.typeId, type: q.type, q: q.q, domaineId: q.domaineId, sousdomaineId: q.sousdomaineId,
      created_from: q.created_from, created_to: q.created_to,
    });
    res.send(csv);
  }
}
