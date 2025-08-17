// src/permissions/permissions.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { ListPermissionsQueryDto } from './dto/list-permissions.query.dto';

function meta(p:number, ps:number, t:number){ return { page:p, pageSize:ps, total:t, totalPages: Math.max(1, Math.ceil(t/Math.max(1,ps))) }; }

@ApiTags('Permissions')
@Controller('api/v1/permissions')
export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les permissions (pagination + recherche)',
    description: 'Recherche plein texte sur le code, tri multi-champs, pagination.',
  })
  async list(@Query() q: ListPermissionsQueryDto) {
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 100);
    const { total, items } = await this.service.list({ page, pageSize, sort: q.sort, q: q.q });
    return { message: 'Liste des permissions.', messageE: 'Permissions list.', data: items, meta: meta(page, pageSize, total) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une permission', description: 'Retourne la permission et les rôles qui la possèdent.' })
  async getOne(@Param('id') id: string) {
    const row = await this.service.getOne(Number(id));
    return { message: 'Permission récupérée.', messageE: 'Permission fetched.', data: row };
  }
}
