import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { UserRolesService } from './user-roles.service';
import { ListUserRolesQueryDto } from './dto/list-user-roles.query.dto';
import { AssignRolesDto, RevokeRolesDto } from './dto/assign-roles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from '../auth/guards/not-blocked.guard';

class ErrorResponseDto {
  message: string;
  messageE: string;
}

class RoleLiteDto {
  id: number;
  nom: string;
}

class UserLiteDto {
  id: number;
  nom: string;
  email: string;
}

class UserRoleItemDto {
  utilisateurId: number;
  roleId: number;
  user: UserLiteDto;
  role: RoleLiteDto;
}

class UserRolesListResponseDto {
  message: string;
  messageE: string;
  data: UserRoleItemDto[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

class AssignedRolesResponseDto {
  message: string;
  messageE: string;
  data: RoleLiteDto[];
}

function meta(p: number, ps: number, t: number) {
  return {
    page: p,
    pageSize: ps,
    total: t,
    totalPages: Math.max(1, Math.ceil(t / Math.max(1, ps))),
  };
}

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
  @ApiOkResponse({
    description: 'Associations listées',
    type: UserRolesListResponseDto,
  })
  async list(@Query() q: ListUserRolesQueryDto) {
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 100);
    const { total, items } = await this.service.list({
      page,
      pageSize,
      sort: q.sort,
      userId: q.userId,
      roleId: q.roleId,
    });

    return {
      message: 'Associations listées.',
      messageE: 'Mappings listed.',
      data: items,
      meta: meta(page, pageSize, total),
    };
  }

  @Post('assign')
  @ApiOperation({
    summary: 'Assigner un ou plusieurs rôles à un utilisateur',
    description: 'Idempotent : ignore les doublons. Vérifie les IDs.',
  })
  @ApiOkResponse({
    description: 'Rôles assignés',
    type: AssignedRolesResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Utilisateur ou rôles invalides',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Non authentifié',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Compte bloqué',
    type: ErrorResponseDto,
  })
  async assign(@Body() b: AssignRolesDto) {
    const roles = await this.service.assign(b.userId, b.roleIds);
    return {
      message: 'Rôles assignés.',
      messageE: 'Roles assigned.',
      data: roles,
    };
  }

  @Post('revoke')
  @ApiOperation({
    summary: 'Révoquer un ou plusieurs rôles d’un utilisateur',
    description: 'Supprime les liaisons UtilisateurRole correspondantes.',
  })
  @ApiOkResponse({
    description: 'Rôles révoqués',
    type: AssignedRolesResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Non authentifié',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Compte bloqué',
    type: ErrorResponseDto,
  })
  async revoke(@Body() b: RevokeRolesDto) {
    const roles = await this.service.revoke(b.userId, b.roleIds);
    return {
      message: 'Rôles révoqués.',
      messageE: 'Roles revoked.',
      data: roles,
    };
  }
}