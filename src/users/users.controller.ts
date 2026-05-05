import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from '../auth/guards/not-blocked.guard';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ErrorResponseDto,
  UserListResponseDto,
  UserSingleResponseDto,
} from './dto/user-response.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, NotBlockedGuard)
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiConsumes('application/json', 'multipart/form-data')
  @UseInterceptors(FileInterceptor('pictureFile'))
  @ApiBody({
    type: CreateUserDto,
    description:
      'Création utilisateur. La photo peut être envoyée soit en JSON avec picture, soit en multipart avec pictureFile.',
  })
  @ApiOperation({
    summary: 'Créer un utilisateur',
    description: `
      CRÉATION D'UN UTILISATEUR

      Cette API crée un utilisateur système.

      RÈGLES IMPORTANTES :
      - isVerified passe automatiquement à true côté backend.
      - Le mot de passe est hashé avant enregistrement.
      - email et phone doivent être uniques.
      - On ne crée pas de rôle ici.
      - Le type métier est envoyé dans le champ "type".
      - regionId, departementId, groupeId et zoneId peuvent être null ou absents au début.
      - La photo peut être envoyée en URL, base64 ou multipart/form-data.
      - L’upload Cloudinary se fait en arrière-plan pour ne pas bloquer la requête.

      TYPES POSSIBLES :
      - AGENT_COLLECTE
      - POINT_FOCAL
      - COORDINATION
      - ADMIN
      - SUPERADMIN
    `,
  })
  @ApiCreatedResponse({
    description: 'Utilisateur créé avec succès.',
    type: UserSingleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Données invalides ou incohérence géographique.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Email ou téléphone déjà utilisé.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Non authentifié.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Compte bloqué ou accès refusé.',
    type: ErrorResponseDto,
  })
  async create(
    @Body() dto: CreateUserDto,
    @UploadedFile() pictureFile?: Express.Multer.File,
  ) {
    return await this.usersService.create(dto, pictureFile);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister les utilisateurs avec filtres avancés',
    description: `
      LISTE PAGINÉE DES UTILISATEURS

      FILTRES DISPONIBLES :
      - search : recherche globale sur prénom, nom, email, téléphone et type.
      - firstName : filtre par prénom.
      - lastName : filtre par nom.
      - email : filtre par email.
      - phone : filtre par téléphone.
      - type : AGENT_COLLECTE, POINT_FOCAL, COORDINATION, ADMIN, SUPERADMIN.
      - regionId : filtre par région.
      - departementId : filtre par département.
      - groupeId : filtre par groupe.
      - zoneId : filtre par zone.
      - isBlock : true ou false.
      - isVerified : true ou false.
      - isDeleted : true ou false.
      - createdFrom : date de début.
      - createdTo : date de fin.

      PAGINATION :
      - page : page demandée, par défaut 1.
      - limit : nombre d’éléments par page, par défaut 10, maximum 100.

      EXEMPLES :
      - /api/v1/users?type=AGENT_COLLECTE
      - /api/v1/users?type=POINT_FOCAL&regionId=1
      - /api/v1/users?search=agent
      - /api/v1/users?isBlock=false
    `,
  })
  @ApiOkResponse({
    description: 'Liste des utilisateurs récupérée avec succès.',
    type: UserListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Paramètres de recherche invalides.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Non authentifié.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Compte bloqué ou accès refusé.',
    type: ErrorResponseDto,
  })
  async getAll(@Query() query: QueryUserDto) {
    return await this.usersService.getAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un utilisateur par son ID',
    description: `
      DÉTAIL D'UN UTILISATEUR

      Cette API retourne :
      - informations personnelles ;
      - type métier ;
      - affectation géographique ;
      - statut bloqué / vérifié / supprimé ;
      - photo de profil si disponible.
    `,
  })
  @ApiOkResponse({
    description: 'Utilisateur récupéré avec succès.',
    type: UserSingleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Utilisateur introuvable.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Non authentifié.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Compte bloqué ou accès refusé.',
    type: ErrorResponseDto,
  })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.getOne(id);
  }

  @Patch(':id')
  @ApiConsumes('application/json', 'multipart/form-data')
  @UseInterceptors(FileInterceptor('pictureFile'))
  @ApiBody({
    type: UpdateUserDto,
    description:
      'Mise à jour utilisateur. La photo peut être envoyée soit en JSON avec picture, soit en multipart avec pictureFile.',
  })
  @ApiOperation({
    summary: 'Mettre à jour un utilisateur',
    description: `
      MISE À JOUR D'UN UTILISATEUR

      Champs modifiables :
      - firstName
      - lastName
      - email
      - phone
      - password
      - type
      - regionId
      - departementId
      - groupeId
      - zoneId
      - picture en URL ou base64
      - pictureFile en multipart/form-data

      IMPORTANT :
      - Si password est fourni, il est hashé.
      - Si regionId, departementId, groupeId ou zoneId vaut null, la relation est supprimée.
      - Si picture vaut null ou chaîne vide, la photo est supprimée.
      - Si picture est base64 ou pictureFile est fourni, l’upload Cloudinary se fait en arrière-plan.
    `,
  })
  @ApiOkResponse({
    description: 'Utilisateur mis à jour avec succès.',
    type: UserSingleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Données invalides ou incohérence géographique.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Email ou téléphone déjà utilisé.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Utilisateur introuvable.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Non authentifié.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Compte bloqué ou accès refusé.',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @UploadedFile() pictureFile?: Express.Multer.File,
  ) {
    return await this.usersService.update(id, dto, pictureFile);
  }

  @Patch(':id/block')
  @ApiOperation({
    summary: 'Bloquer un utilisateur',
    description: `
      BLOCAGE D'UN UTILISATEUR

      Cette API bloque le compte utilisateur.
      Un utilisateur bloqué ne peut plus se connecter ni utiliser les endpoints protégés.
    `,
  })
  @ApiOkResponse({
    description: 'Utilisateur bloqué avec succès.',
    type: UserSingleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Utilisateur introuvable.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Non authentifié.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Compte bloqué ou accès refusé.',
    type: ErrorResponseDto,
  })
  async block(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.block(id);
  }

  @Patch(':id/unblock')
  @ApiOperation({
    summary: 'Débloquer un utilisateur',
    description: `
      DÉBLOCAGE D'UN UTILISATEUR

      Cette API débloque le compte utilisateur.
      Le compteur loginAttempt est remis à 0.
    `,
  })
  @ApiOkResponse({
    description: 'Utilisateur débloqué avec succès.',
    type: UserSingleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Utilisateur introuvable.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Non authentifié.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Compte bloqué ou accès refusé.',
    type: ErrorResponseDto,
  })
  async unblock(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.unblock(id);
  }
}