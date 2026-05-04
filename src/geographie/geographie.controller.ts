import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GeographieService } from './geographie.service';
import {
  GetArrondissementsQueryDto,
  GetDepartementsQueryDto,
  GetRegionsQueryDto,
} from './dto/query-geographie.dto';
import {
  ArrondissementsListResponseDto,
  DepartementsListResponseDto,
  ErrorResponseDto,
  RegionsListResponseDto,
} from './dto/geographie-response.dto';

@ApiTags('Géographie')
@Controller('api/v1/geographie')
export class GeographieController {
  constructor(private readonly geographieService: GeographieService) {}

  @Get('regions')
  @ApiOperation({
    summary: 'Récupérer toutes les régions avec filtre par nom',
    description: `
      LISTE DES RÉGIONS
      
      Cette API retourne la liste paginée des régions enregistrées dans la base de données.
      
      FILTRE DISPONIBLE :
      - name : recherche par nom français ou anglais de la région.
      
      PARAMÈTRES DE PAGINATION :
      - page : numéro de page, par défaut 1.
      - limit : nombre d’éléments par page, par défaut 50, maximum 200.
      
      EXEMPLES :
      - /api/v1/geographie/regions
      - /api/v1/geographie/regions?name=NORD
      - /api/v1/geographie/regions?name=North
      - /api/v1/geographie/regions?page=1&limit=20
      
      RÉSULTAT :
      Chaque région contient :
      - id
      - name : nom français
      - nameEn : nom anglais
      - totalDepartements
      - createdAt
      - updatedAt
    `,
  })
  @ApiOkResponse({
    description: 'Régions récupérées avec succès.',
    type: RegionsListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Paramètres de recherche invalides.',
    type: ErrorResponseDto,
  })
  async getRegions(@Query() query: GetRegionsQueryDto) {
    return await this.geographieService.getRegions(query);
  }

  @Get('departements')
  @ApiOperation({
    summary: 'Récupérer tous les départements avec filtre par région et par nom',
    description: `
      LISTE DES DÉPARTEMENTS
      
      Cette API retourne la liste paginée des départements.
      
      FILTRES DISPONIBLES :
      - regionId : filtre les départements d’une région précise.
      - name : recherche par nom français ou anglais du département.
      
      PARAMÈTRES DE PAGINATION :
      - page : numéro de page, par défaut 1.
      - limit : nombre d’éléments par page, par défaut 50, maximum 200.
      
      EXEMPLES :
      - /api/v1/geographie/departements
      - /api/v1/geographie/departements?regionId=1
      - /api/v1/geographie/departements?name=BENOUE
      - /api/v1/geographie/departements?regionId=1&name=BENOUE
      - /api/v1/geographie/departements?page=1&limit=20
      
      RÉSULTAT :
      Chaque département contient :
      - id
      - name : nom français
      - nameEn : nom anglais
      - regionId
      - region
      - totalArrondissements
      - createdAt
      - updatedAt
    `,
  })
  @ApiOkResponse({
    description: 'Départements récupérés avec succès.',
    type: DepartementsListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Paramètres de recherche invalides.',
    type: ErrorResponseDto,
  })
  async getDepartements(@Query() query: GetDepartementsQueryDto) {
    return await this.geographieService.getDepartements(query);
  }

  @Get('arrondissements')
  @ApiOperation({
    summary:
      'Récupérer tous les arrondissements avec filtre par région, département et nom',
    description: `
      LISTE DES ARRONDISSEMENTS
      
      Cette API retourne la liste paginée des arrondissements.
      
      FILTRES DISPONIBLES :
      - regionId : filtre les arrondissements d’une région précise.
      - departementId : filtre les arrondissements d’un département précis.
      - name : recherche par nom français ou anglais de l’arrondissement.
      
      IMPORTANT :
      - Si regionId et departementId sont fournis ensemble, l’API retourne uniquement les arrondissements du département indiqué si ce département appartient bien à cette région.
      - Si le département ne correspond pas à la région, la liste retournée sera vide.
      
      PARAMÈTRES DE PAGINATION :
      - page : numéro de page, par défaut 1.
      - limit : nombre d’éléments par page, par défaut 50, maximum 200.
      
      EXEMPLES :
      - /api/v1/geographie/arrondissements
      - /api/v1/geographie/arrondissements?regionId=1
      - /api/v1/geographie/arrondissements?departementId=3
      - /api/v1/geographie/arrondissements?name=GAROUA
      - /api/v1/geographie/arrondissements?regionId=1&departementId=3&name=GAROUA
      
      RÉSULTAT :
      Chaque arrondissement contient :
      - id
      - name : nom français
      - nameEn : nom anglais
      - departementId
      - departement
      - departement.region
      - createdAt
      - updatedAt
    `,
  })
  @ApiOkResponse({
    description: 'Arrondissements récupérés avec succès.',
    type: ArrondissementsListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Paramètres de recherche invalides.',
    type: ErrorResponseDto,
  })
  async getArrondissements(@Query() query: GetArrondissementsQueryDto) {
    return await this.geographieService.getArrondissements(query);
  }
}