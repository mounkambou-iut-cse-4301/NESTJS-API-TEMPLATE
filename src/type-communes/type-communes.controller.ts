import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TypeCommunesService } from './type-communes.service';
import { ListTypeCommunesQueryDto } from './dto/list-type-communes.query.dto';
import { CreateTypeCommuneDto } from './dto/create-type-commune.dto';
import { UpdateTypeCommuneDto } from './dto/update-type-commune.dto';
import { TypeCommuneIdParamDto } from './dto/type-commune-id.param.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, NotBlockedGuard)
@ApiTags('TypeCommune')
@Controller('api/v1/type-communes')
export class TypeCommunesController {
  constructor(private readonly service: TypeCommunesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister types de communes', description: 'Pagination + recherche par nom, tri: id|name' })
  async list(@Query() q: ListTypeCommunesQueryDto) {
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 100);

    const allowed = ['id', 'name'];
    const orders: Record<string,'asc'|'desc'> = {};
    if (q.sort) {
      for (const t of q.sort.split(',').map(s=>s.trim()).filter(Boolean)) {
        const desc = t.startsWith('-'); const key = desc ? t.slice(1) : t;
        if (allowed.includes(key)) orders[key] = desc ? 'desc' : 'asc';
      }
    }

    const { items, meta } = await this.service.list({
      page, pageSize, sort: Object.keys(orders).length ? orders : undefined, q: q.q,
    });
    return { message: 'Types chargés.', messageE: 'Types loaded.', data: items, meta };
  }

  @Post()
  @ApiOperation({ summary: 'Créer un type de commune' })
  async create(@Body() dto: CreateTypeCommuneDto) {
    const row = await this.service.create(dto);
    return { message: 'Type créé.', messageE: 'Type created.', data: row };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail type de commune' })
  async getOne(@Param() p: TypeCommuneIdParamDto) {
    const row = await this.service.findOne(p.id);
    return { message: 'Type récupéré.', messageE: 'Type fetched.', data: row };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un type de commune' })
  async update(@Param() p: TypeCommuneIdParamDto, @Body() dto: UpdateTypeCommuneDto) {
    const row = await this.service.update(p.id, dto);
    return { message: 'Type mis à jour.', messageE: 'Type updated.', data: row };
  }
}
