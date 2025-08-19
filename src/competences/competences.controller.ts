import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompetencesService } from './competences.service';
import { ListCompetencesQueryDto } from './dto/list-competences.query.dto';
import { CreateCompetenceDto } from './dto/create-competence.dto';
import { UpdateCompetenceDto } from './dto/update-competence.dto';
import { CompetenceIdParamDto } from './dto/competence-id.param.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, NotBlockedGuard)
@ApiTags('Competences')
@Controller('api/v1/competences')
export class CompetencesController {
  constructor(private readonly service: CompetencesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister compétences', description: 'Pagination + recherche par nom, tri: id|name' })
  async list(@Query() q: ListCompetencesQueryDto) {
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
    return { message: 'Compétences chargées.', messageE: 'Competences loaded.', data: items, meta };
  }

  @Post()
  @ApiOperation({ summary: 'Créer une compétence' })
  async create(@Body() dto: CreateCompetenceDto) {
    const row = await this.service.create(dto);
    return { message: 'Compétence créée.', messageE: 'Competence created.', data: row };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail compétence' })
  async getOne(@Param() p: CompetenceIdParamDto) {
    const row = await this.service.findOne(p.id);
    return { message: 'Compétence récupérée.', messageE: 'Competence fetched.', data: row };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une compétence' })
  async update(@Param() p: CompetenceIdParamDto, @Body() dto: UpdateCompetenceDto) {
    const row = await this.service.update(p.id, dto);
    return { message: 'Compétence mise à jour.', messageE: 'Competence updated.', data: row };
  }
}
