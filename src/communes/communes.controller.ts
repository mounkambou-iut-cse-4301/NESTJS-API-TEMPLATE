import { Controller, Get, Post, Body, Query, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommunesService } from './communes.service';
import { ListCommunesQueryDto } from './dto/list-communes.query.dto';
import { CreateCommuneDto } from './dto/create-commune.dto';
import { UpdateCommuneDto } from './dto/update-commune.dto';
import { CommuneIdParamDto } from './dto/commune-id.param.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';

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

 @ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, NotBlockedGuard)
@ApiTags('Communes')
@Controller('api/v1/communes')
export class CommunesController {
  constructor(private readonly service: CommunesService) {}

  @ApiOperation({ summary: 'Lister les communes', description: 'Liste paginée avec filtres (q, code, arrondissementId, is_verified, is_block) et tri sur id, nom, nom_en, code.' })
  @Get()
  async list(@Query() q: ListCommunesQueryDto, @Req() req: any) {
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 100);
    const sort = sanitizeSort(q.sort, ['id','nom','nom_en','code']);
    const { total, items } = await this.service.list({
      page, pageSize, sort,
      q: q.q,
      arrondissementId: q.arrondissementId,
      code: q.code,
      typeCommuneId: q.typeCommuneId,
      is_verified: q.is_verified === undefined ? undefined : q.is_verified === 'true',
      is_block:    q.is_block    === undefined ? undefined : q.is_block    === 'true',
        req, // pour le logging
    });
    return { message: 'Liste des communes récupérée.', messageE: 'Municipalities list retrieved.', data: items, meta: buildMeta(page, pageSize, total) };
  }

  @ApiOperation({ summary: 'Créer une commune', description: 'Création d’une commune rattachée à un arrondissement, avec flags administratifs.' })
  @Post()
  async create(@Body() dto: CreateCommuneDto) {
    const created = await this.service.create(dto);
    return { message: 'Commune créée avec succès.', messageE: 'Municipality created successfully.', data: created };
  }

  @ApiOperation({ summary: 'Détail commune', description: 'Récupérer une commune par son id.' })
  @Get(':id')
  async getOne(@Param() p: CommuneIdParamDto) {
    const row = await this.service.findOne(p.id);
    return { message: 'Commune récupérée.', messageE: 'Municipality fetched.', data: row };
  }

  @ApiOperation({ summary: 'Mettre à jour une commune', description: 'Mise à jour partielle: nom, nom_en, code, arrondissementId, is_verified, is_block.' })
  @Patch(':id')
  async update(@Param() p: CommuneIdParamDto, @Body() dto: UpdateCommuneDto) {
    const row = await this.service.update(p.id, dto);
    return { message: 'Commune mise à jour.', messageE: 'Municipality updated.', data: row };
  }

  @Patch(':id/toggle-block')
  @ApiOperation({
    summary: 'Activer / Désactiver une commune',
    description:
      'Inverse le statut de blocage (is_block). Si la commune était active (is_block=false), elle devient désactivée (is_block=true), et inversement.',
  })
  async toggleBlock(@Param() p: CommuneIdParamDto) {
    const updated = await this.service.toggleBlock(p.id);
    const wasBlocked = updated.is_block; // statut après MAJ
    return {
      message: wasBlocked ? 'Commune désactivée (bloquée).' : 'Commune activée (débloquée).',
      messageE: wasBlocked ? 'Municipality deactivated (blocked).' : 'Municipality activated (unblocked).',
      data: updated,
    };
  }
}
