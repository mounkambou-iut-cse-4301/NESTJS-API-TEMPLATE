// src/user-roles/user-roles.controller.ts
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRolesService } from './user-roles.service';
import { ListUserRolesQueryDto } from './dto/list-user-roles.query.dto';
import { AssignRolesDto, RevokeRolesDto } from './dto/assign-roles.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';

function meta(p:number, ps:number, t:number){ return { page:p, pageSize:ps, total:t, totalPages: Math.max(1, Math.ceil(t/Math.max(1,ps))) }; }
 @ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, NotBlockedGuard)
@ApiTags('User-Roles')
@Controller('api/v1/user-roles')
export class UserRolesController {
  constructor(private readonly service: UserRolesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les associations utilisateur ↔ rôle',
    description: 'Filtre par userId/roleId, pagination, tri.',
  })
  async list(@Query() q: ListUserRolesQueryDto) {
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 100);
    const { total, items } = await this.service.list({ page, pageSize, sort: q.sort, userId: q.userId, roleId: q.roleId });
    return { message: 'Associations listées.', messageE: 'Mappings listed.', data: items, meta: meta(page, pageSize, total) };
  }

  @Post('assign')
  @ApiOperation({
    summary: 'Assigner un ou plusieurs rôles à un utilisateur',
    description: 'Idempotent : ignore les doublons. Vérifie les IDs.',
  })
  async assign(@Body() b: AssignRolesDto) {
    const roles = await this.service.assign(b.userId, b.roleIds);
    return { message: 'Rôles assignés.', messageE: 'Roles assigned.', data: roles };
  }

  @Post('revoke')
  @ApiOperation({
    summary: 'Révoquer un ou plusieurs rôles d’un utilisateur',
    description: 'Supprime les liaisons UtilisateurRole correspondantes.',
  })
  async revoke(@Body() b: RevokeRolesDto) {
    const roles = await this.service.revoke(b.userId, b.roleIds);
    return { message: 'Rôles révoqués.', messageE: 'Roles revoked.', data: roles };
  }
}
