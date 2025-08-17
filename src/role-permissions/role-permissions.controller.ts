// src/role-permissions/role-permissions.controller.ts
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolePermissionsService } from './role-permissions.service';
import { ListRolePermsQueryDto } from './dto/list-role-perms.query.dto';
import { AttachPermsDto, DetachPermsDto } from './dto/attach-perms.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';

function meta(p:number, ps:number, t:number){ return { page:p, pageSize:ps, total:t, totalPages: Math.max(1, Math.ceil(t/Math.max(1,ps))) }; }
 @ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, NotBlockedGuard)
@ApiTags('Role-Permissions')
@Controller('api/v1/role-permissions')
export class RolePermissionsController {
  constructor(private readonly service: RolePermissionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les associations rôle ↔ permission',
    description: 'Filtre par roleId/permissionId ou par motif sur code de permission, pagination/tri.',
  })
  async list(@Query() q: ListRolePermsQueryDto) {
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 100);
    const { total, items } = await this.service.list({
      page, pageSize, sort: q.sort, roleId: q.roleId, permissionId: q.permissionId, q: q.q,
    });
    return { message: 'Associations listées.', messageE: 'Mappings listed.', data: items, meta: meta(page, pageSize, total) };
  }

  @Post('attach')
  @ApiOperation({
    summary: 'Associer des permissions à un rôle',
    description: 'Idempotent — ignore les doublons. Valide les IDs.',
  })
  async attach(@Body() b: AttachPermsDto) {
    const perms = await this.service.attach(b.roleId, b.permissionIds);
    return { message: 'Permissions associées.', messageE: 'Permissions attached.', data: perms };
  }

  @Post('detach')
  @ApiOperation({
    summary: 'Retirer des permissions d’un rôle',
    description: 'Supprime les liaisons RolePermission correspondantes.',
  })
  async detach(@Body() b: DetachPermsDto) {
    const perms = await this.service.detach(b.roleId, b.permissionIds);
    return { message: 'Permissions retirées.', messageE: 'Permissions detached.', data: perms };
  }
}
