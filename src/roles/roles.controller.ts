// src/roles/roles.controller.ts
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { ListRolesQueryDto } from './dto/list-roles.query.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

function meta(page:number, pageSize:number, total:number){
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  return { page, pageSize, total, totalPages };
}

@ApiTags('Roles')
@Controller('api/v1/roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les rôles (pagination + filtres)',
    description:
      'Retourne la liste paginée des rôles avec recherche plein texte sur le nom et filtre par code de permission associé.',
  })
  async list(@Query() q: ListRolesQueryDto) {
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 100);
    const { total, items } = await this.service.list({ page, pageSize, sort: q.sort, q: q.q, permissionCode: q.permissionCode });
    return { message: 'Liste des rôles.', messageE: 'Roles list.', data: items, meta: meta(page, pageSize, total) };
  }

  @Post()
  @ApiOperation({ summary: 'Créer un rôle', description: 'Crée un rôle par son nom (unique).' })
  async create(@Body() dto: CreateRoleDto) {
    const row = await this.service.create(dto.nom);
    return { message: 'Rôle créé.', messageE: 'Role created.', data: row };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un rôle', description: 'Retourne le rôle, ses permissions associées et le nombre d’utilisateurs.' })
  async getOne(@Param('id') id: string) {
    const row = await this.service.getOne(Number(id));
    return { message: 'Rôle récupéré.', messageE: 'Role fetched.', data: row };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un rôle', description: 'Permet de changer le nom du rôle.' })
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    const row = await this.service.update(Number(id), dto.nom);
    return { message: 'Rôle mis à jour.', messageE: 'Role updated.', data: row };
  }
}
