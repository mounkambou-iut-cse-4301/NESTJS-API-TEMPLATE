import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TypesService } from './types.service';
import { ListTypesQueryDto } from './dto/list-types.query.dto';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
import { TypeIdParamDto } from './dto/type-id.param.dto';

function sanitizeSort(sort: string | undefined, allowed: string[]) {
  if (!sort) return undefined;
  const orders: Record<string,'asc'|'desc'> = {};
  for (const t of sort.split(',').map(s=>s.trim()).filter(Boolean)) {
    const desc = t.startsWith('-'); const key = desc ? t.slice(1) : t;
    if (allowed.includes(key)) orders[key] = desc ? 'desc' : 'asc';
  }
  return Object.keys(orders).length ? orders : undefined;
}
function meta(p:number, s:number, total:number) {
  return { page: p, pageSize: s, total, totalPages: Math.max(1, Math.ceil(total/Math.max(1,s))) };
}

@ApiTags('TypesInfrastructure')
@Controller('api/v1/types')
export class TypesController {
  constructor(private readonly service: TypesService) {}

  @ApiOperation({
    summary: 'Lister les types (modèles)',
    description: 'Pagination + filtres: q (name/description), type=SIMPLE|COMPLEXE, domaineId, sousdomaineId; tri: id,name,type,created_at.',
  })
  @Get()
  async list(@Query() q: ListTypesQueryDto) {
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 100);
    const sort = sanitizeSort(q.sort, ['id','name','type','created_at']);
    const { total, items } = await this.service.list({
      page, pageSize, sort, q: q.q, type: q.type, domaineId: q.domaineId, sousdomaineId: q.sousdomaineId,
    });
    return { message: 'Liste des types récupérée.', messageE: 'Types list retrieved.', data: items, meta: meta(page,pageSize,total) };
  }

  @ApiOperation({ summary: 'Créer un type (modèle)', description: 'Public pour l’instant. Normalisation JSON: type MAJ, attribus array, location objet, enum CSV→array, composant.description acceptée.' })
  @Post()
  async create(@Body() dto: CreateTypeDto) {
    const created = await this.service.create(dto);
    return { message: 'Type créé avec succès.', messageE: 'Type created successfully.', data: created };
  }

  @ApiOperation({ summary: 'Détail d’un type', description: 'Inclut attribus[]/composant[] (array), location (objet), domaineId/sousdomaineId.' })
  @Get(':id')
  async getOne(@Param() p: TypeIdParamDto) {
    const row = await this.service.findOne(p.id);
    return { message: 'Type récupéré.', messageE: 'Type fetched.', data: row };
  }

  @ApiOperation({ summary: 'Mettre à jour un type', description: 'Mise à jour partielle. Même normalisation que create().' })
  @Patch(':id')
  async update(@Param() p: TypeIdParamDto, @Body() dto: UpdateTypeDto) {
    const row = await this.service.update(p.id, dto);
    return { message: 'Type mis à jour.', messageE: 'Type updated.', data: row };
  }

  @ApiOperation({ summary: 'Forme dynamique', description: 'Expose attribus[]/composant[] prêts pour le front. CSV enum → array. composant.description supportée.' })
  @Get(':id/form')
  async form(@Param() p: TypeIdParamDto) {
    const payload = await this.service.form(p.id);
    return { message: 'Forme récupérée.', messageE: 'Form retrieved.', data: payload };
  }

  @ApiOperation({ summary: 'Usage du type', description: 'Comptes d’infras par territoires.' })
  @Get(':id/usage')
  async usage(@Param() p: TypeIdParamDto) {
    const data = await this.service.usage(p.id);
    return { message: 'Usage calculé.', messageE: 'Usage computed.', data };
  }

  @ApiOperation({ summary: 'Supprimer un type', description: 'Refus si déjà utilisé par des infrastructures.' })
  @Delete(':id')
  async remove(@Param() p: TypeIdParamDto) {
    await this.service.remove(p.id);
    return { message: 'Type supprimé.', messageE: 'Type deleted.' };
  }
}
