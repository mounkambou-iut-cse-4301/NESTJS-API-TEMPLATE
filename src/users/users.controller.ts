import { Controller, Get, Post, Body, Param, Query, Patch, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users.query.dto';
import { UserIdParamDto } from './dto/user-id.param.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';

function parseSortLocal(sort?: string): Record<string, 'asc' | 'desc'> | undefined {
  if (!sort) return undefined;
  const orders: Record<string, 'asc' | 'desc'> = {};
  for (const token of sort.split(',').map((s) => s.trim()).filter(Boolean)) {
    if (token.startsWith('-')) orders[token.slice(1)] = 'desc';
    else orders[token] = 'asc';
  }
  return orders;
}

function buildMetaLocal(page: number, pageSize: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  return { page, pageSize, total, totalPages };
}
//  @ApiBearerAuth('JWT-auth')
// @UseGuards(JwtAuthGuard, NotBlockedGuard) // 👈 tu mets ça seulement ici si tu le veux

@ApiTags('Users')
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  /** GET /api/v1/users — liste + filtres + pagination */
  @ApiOperation({ summary:'api pour avoir tous les utilisateurs par filtre et par pagination'})
  @Get()
  async list(@Query() q: ListUsersQueryDto) {
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 100);
    const sort = parseSortLocal(q.sort);

    const { total, items } = await this.service.list({
      page,
      pageSize,
      sort,
      communeId: q.communeId,
      is_verified: q.is_verified === undefined ? undefined : q.is_verified === 'true',
      is_block: q.is_block === undefined ? undefined : q.is_block === 'true',
      q: q.q,
    });

    return {
      message: 'Liste des utilisateurs chargée avec succès.',
      messageE: 'Users list loaded successfully.',
      data: items,
      meta: buildMetaLocal(page, pageSize, total),
    };
  }

  /** POST /api/v1/users — création (upload base64 + email texte) */
  @ApiOperation({ summary:'api pour créer un utilisateur' })
  @Post()
  async create(@Body() dto: CreateUserDto) {
    const created = await this.service.create(dto);
    return {
      message: 'Utilisateur créé avec succès. Un email de bienvenue a été envoyé.',
      messageE: 'User created successfully. A welcome email has been sent.',
      data: created,
    };
  }

  /** GET /api/v1/users/:id — détail */
  @ApiOperation({ summary:'api pour récupérer un utilisateur par ID' })
  @Get(':id')
  async getOne(@Param() params: UserIdParamDto) {
    const user = await this.service.findOne(params.id);
    return {
      message: 'Utilisateur récupéré avec succès.',
      messageE: 'User fetched successfully.',
      data: user,
    };
  }

  /** PATCH /api/v1/users/:id — mise à jour (upload base64 possible) */
  @ApiOperation({ summary:'api pour mettre à jour un utilisateur' })
  @Patch(':id')
  async update(@Param() params: UserIdParamDto, @Body() dto: UpdateUserDto) {
    const user = await this.service.update(params.id, dto);
    return {
      message: 'Utilisateur mis à jour avec succès.',
      messageE: 'User updated successfully.',
      data: user,
    };
  }

  /** DELETE /api/v1/users/:id — suppression */
  @ApiOperation({ summary:'api pour supprimer un utilisateur' })
  @Delete(':id')
  async remove(@Param() params: UserIdParamDto) {
    await this.service.remove(params.id);
    return {
      message: 'Utilisateur supprimé avec succès.',
      messageE: 'User deleted successfully.',
      data: { id: params.id },
    };
  }
}
