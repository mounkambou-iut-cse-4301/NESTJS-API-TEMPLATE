import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParcoursService } from './parcours.service';
import { ListParcoursQueryDto } from './dto/list-parcours.query.dto';
import { ParoursBulkDto } from './dto/parcours-bulk.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, NotBlockedGuard)
@ApiTags('Parcours')
@Controller('api/v1/parcours')
export class ParcoursController {
  constructor(private readonly service: ParcoursService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les points collectés',
    description:
      'Pagination + filtres (collecteurId, from/to sur recordedAt). Si user connecté et collecteurId non fourni, on borne automatiquement à son propre ID.',
  })
  async list(@Query() q: ListParcoursQueryDto, @Req() req: any) {
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 100);

    // Tri autorisé
    const allowed = ['id', 'recordedAt', 'created_at'];
    const orders: Record<string, 'asc'|'desc'> = {};
    if (q.sort) {
      for (const token of q.sort.split(',').map(s=>s.trim()).filter(Boolean)) {
        const desc = token.startsWith('-');
        const key = desc ? token.slice(1) : token;
        if (allowed.includes(key)) orders[key] = desc ? 'desc' : 'asc';
      }
    }

    const { data, meta } = await this.service.list({
      page, pageSize, sort: Object.keys(orders).length ? orders : undefined,
      collecteurId: q.collecteurId, from: q.from, to: q.to, req,
    });

    return {
      message: 'Points chargés.',
      messageE: 'Points loaded.',
      data, meta,
    };
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Créer plusieurs points en une fois',
    description:
      'Body: { items: [{ latitude, longitude, recordedAt?, collecteurId? }, ...] }. ' +
      'Si collecteurId non fourni → on prend req.user.id (si connecté). Retour par élément: {index, id|error}.',
  })
  async bulk(@Body() dto: ParoursBulkDto, @Req() req: any) {
    const res = await this.service.createBulk(dto.items, req);
    return {
      message: 'Insertion bulk terminée.',
      messageE: 'Bulk insert completed.',
      ...res,
    };
  }
}
