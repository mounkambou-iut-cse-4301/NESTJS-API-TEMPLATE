import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateUserDocumentsDto } from './dto/update-user-documents.dto';
import {
  AddressListResponseDto,
  AddressSingleResponseDto,
  DocumentListResponseDto,
  ErrorResponseDto,
  GenericMessageResponseDto,
  UserSingleResponseDto,
  UsersListResponseDto,
} from './dto/user-response.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';

 @ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, NotBlockedGuard)
@ApiTags('Users')
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary:
      'Créer un utilisateur / inscription',
    description:
      'Crée un utilisateur. Si le type est INSTITUT, les documents/images de l’institut sont obligatoires. Les images/documents sont optimisés et limités à 500 Ko maximum. on a plusieurs type (CLIENT, INSTITUT, PROFESSIONEL)',
  })
  @ApiCreatedResponse({
    description: 'Utilisateur créé avec succès',
    type: UserSingleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Données invalides ou documents requis',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Téléphone ou email déjà utilisé pour ce type',
    type: ErrorResponseDto,
  })
  async create(@Body() dto: CreateUserDto) {
    return await this.usersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour un utilisateur',
    description:
      'Met à jour les informations principales d’un utilisateur. Si le type change, le rôle principal est resynchronisé.',
  })
  @ApiOkResponse({
    description: 'Utilisateur mis à jour',
    type: UserSingleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Données invalides',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Téléphone ou email déjà utilisé pour ce type',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Utilisateur introuvable',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return await this.usersService.update(id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister les utilisateurs',
    description:
      'Retourne la liste paginée des utilisateurs avec filtres optionnels.',
  })
  @ApiOkResponse({
    description: 'Liste des utilisateurs',
    type: UsersListResponseDto,
  })
  async getAll(@Query() query: QueryUserDto) {
    return await this.usersService.getAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un utilisateur',
    description:
      'Retourne les informations complètes d’un utilisateur avec rôles, adresses et documents.',
  })
  @ApiOkResponse({
    description: 'Utilisateur trouvé',
    type: UserSingleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Utilisateur introuvable',
    type: ErrorResponseDto,
  })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.getOne(id);
  }

  @Patch(':id/block')
  @ApiOperation({
    summary: 'Bloquer un utilisateur',
    description: 'Passe is_block à true.',
  })
  @ApiOkResponse({
    description: 'Utilisateur bloqué',
    type: GenericMessageResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Utilisateur introuvable',
    type: ErrorResponseDto,
  })
  async block(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.block(id);
  }

  @Patch(':id/unblock')
  @ApiOperation({
    summary: 'Débloquer un utilisateur',
    description:
      'Passe is_block à false et remet nombre_attempts à 0.',
  })
  @ApiOkResponse({
    description: 'Utilisateur débloqué',
    type: GenericMessageResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Utilisateur introuvable',
    type: ErrorResponseDto,
  })
  async unblock(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.unblock(id);
  }

  @Patch(':id/verify')
  @ApiOperation({
    summary: 'Vérifier un utilisateur',
    description: 'Passe is_verified à true.',
  })
  @ApiOkResponse({
    description: 'Utilisateur vérifié',
    type: GenericMessageResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Utilisateur introuvable',
    type: ErrorResponseDto,
  })
  async verify(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.verify(id);
  }

  @Put(':id/documents')
  @ApiOperation({
    summary: 'Remplacer les documents d’un utilisateur',
    description:
      'Supprime les anciens documents et remplace par les nouveaux. Pour INSTITUT, au moins un document est requis.',
  })
  @ApiOkResponse({
    description: 'Documents mis à jour',
    type: DocumentListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Données invalides ou document trop lourd',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Utilisateur introuvable',
    type: ErrorResponseDto,
  })
  async replaceDocuments(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDocumentsDto,
  ) {
    return await this.usersService.replaceDocuments(id, dto);
  }

  @Post(':id/addresses')
  @ApiOperation({
    summary: 'Ajouter une adresse à un utilisateur',
    description: 'Crée une nouvelle adresse liée à l’utilisateur.',
  })
  @ApiCreatedResponse({
    description: 'Adresse créée',
    type: AddressSingleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Utilisateur introuvable',
    type: ErrorResponseDto,
  })
  async addAddress(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAddressDto,
  ) {
    return await this.usersService.addAddress(id, dto);
  }

  @Get(':id/addresses')
  @ApiOperation({
    summary: 'Lister toutes les adresses d’un utilisateur',
    description: 'Retourne toutes les adresses liées à un utilisateur.',
  })
  @ApiOkResponse({
    description: 'Liste des adresses',
    type: AddressListResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Utilisateur introuvable',
    type: ErrorResponseDto,
  })
  async getAddresses(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.getAddresses(id);
  }

  @Patch(':userId/addresses/:addressId')
  @ApiOperation({
    summary: 'Mettre à jour une adresse',
    description:
      'Met à jour une adresse existante appartenant à l’utilisateur.',
  })
  @ApiOkResponse({
    description: 'Adresse mise à jour',
    type: AddressSingleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Utilisateur ou adresse introuvable',
    type: ErrorResponseDto,
  })
  async updateAddress(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('addressId', ParseIntPipe) addressId: number,
    @Body() dto: UpdateAddressDto,
  ) {
    return await this.usersService.updateAddress(
      userId,
      addressId,
      dto,
    );
  }

  @Get(':id/documents')
  @ApiOperation({
    summary: 'Lister tous les documents d’un utilisateur',
    description:
      'Retourne tous les documents liés à l’utilisateur.',
  })
  @ApiOkResponse({
    description: 'Liste des documents',
    type: DocumentListResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Utilisateur introuvable',
    type: ErrorResponseDto,
  })
  async getDocuments(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.getDocuments(id);
  }
}