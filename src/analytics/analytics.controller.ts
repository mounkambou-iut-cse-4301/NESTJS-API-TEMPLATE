import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import {
  OverviewDto, DistributionTypesDto, DistributionDomainesDto, TimeseriesDto,
  TopCommunesDto, TopTypesDto, ChoroplethDto, HeatmapAnalyticsDto,
  CompletenessDto, CoverageDto, AttrDistributionDto, AttrCrosstabDto,
  FreshnessDto
} from './dto/specific';

@ApiTags('Analytics')
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  /* A — Vue d’ensemble */
  @Get('overview')
  @ApiOperation({
    summary:
      'Vue d’ensemble : totaux d’infrastructures, nb de communes actives et répartition SIMPLE/COMPLEXE pour un périmètre (pays/région/département/arrondissement/commune).',
    description: `
Retourne un résumé rapide dans le périmètre choisi.

• total_infrastructures : nombre total d’infras.
• communes_actives : communes avec ≥1 infra.
• repartition : parts "SIMPLE" vs "COMPLEXE".

Filtres (un seul niveau à la fois) :
- level=country|region|departement|arrondissement|commune
- regionId / departementId / arrondissementId / communeId (selon level)
    `,
  })
  async overview(@Query() q: OverviewDto) {
    return await this.service.overview(q);
  }

  /* B — Répartition par type / domaine */
  @Get('distribution/infrastructure-types')
  @ApiOperation({
    summary:
      'Répartition par type d’infrastructure : compte par type dans le périmètre sélectionné (utile pour graphiques barres).',
    description: `
Compte des infrastructures par id de type (TypeInfrastructure).
Même logique de périmètre que "overview".
    `,
  })
  async distTypes(@Query() q: DistributionTypesDto) {
    return await this.service.distributionTypes(q);
  }

  @Get('distribution/domaines')
  @ApiOperation({
    summary:
      'Répartition par domaine : volume d’infrastructures par domaine fonctionnel (santé, éducation, ...).',
    description: `
Compte des infrastructures par Domaine dans la zone choisie (level + id).
    `,
  })
  async distDomaines(@Query() q: DistributionDomainesDto) {
    return await this.service.distributionDomaines(q);
  }

  /* C — Séries temporelles */
  @Get('timeseries/infrastructures-created')
  @ApiOperation({
    summary:
      'Séries temporelles (créations) : nombre d’infras créées par mois/trimestre/année dans un périmètre et une période.',
    description: `
Paramètres :
- group_by=mois|trimestre|annee (défaut: mois)
- from=YYYY-MM-DD, to=YYYY-MM-DD (optionnels)
- level + id pour cadrer la zone.
    `,
  })
  async tsCreated(@Query() q: TimeseriesDto) {
    return await this.service.timeseriesCreated(q);
  }

  @Get('timeseries/updates')
  @ApiOperation({
    summary:
      'Séries temporelles (mises à jour) : nombre d’infras modifiées par mois/trimestre/année dans le périmètre.',
    description: `
Même principe que "créations" mais basé sur updated_at.
    `,
  })
  async tsUpdates(@Query() q: TimeseriesDto) {
    return await this.service.timeseriesUpdates(q);
  }

  /* D — Tops */
  @Get('top/communes')
  @ApiOperation({
    summary:
      'Top communes : classement des communes avec le plus d’infrastructures (limitable, filtrable par périmètre).',
    description: `
Paramètres :
- limit (défaut 10)
- level + id (optionnels) pour restreindre la zone.
    `,
  })
  async topCommunes(@Query() q: TopCommunesDto) {
    return await this.service.topCommunes(q);
  }

  @Get('top/types')
  @ApiOperation({
    summary:
      'Top types : classement des types d’infrastructure les plus présents (limitable, périmètre optionnel).',
    description: `
Paramètres :
- limit (défaut 10)
- level + id (pour limiter la zone).
    `,
  })
  async topTypes(@Query() q: TopTypesDto) {
    return await this.service.topTypes(q);
  }

  /* E — Cartes thématiques */
  @Get('map/choropleth')
  @ApiOperation({
    summary:
      'Carte choropleth : nombre d’infrastructures par commune (prêt pour colorer une carte).',
    description: `
Renvoie la valeur par commune dans le périmètre choisi.
    `,
  })
  async choropleth(@Query() q: ChoroplethDto) {
    return await this.service.mapChoropleth(q);
  }

  @Get('map/heatmap')
  @ApiOperation({
    summary:
      'Carte heatmap : liste des points (lat, lon) d’infrastructures, filtrables par type et période.',
    description: `
Paramètres :
- typeId (optionnel), from/to (optionnels), level + id (périmètre).
    `,
  })
  async heatmap(@Query() q: HeatmapAnalyticsDto) {
    return await this.service.mapHeatmap(q);
  }

  /* F — Qualité des données */
  @Get('completeness')
  @ApiOperation({
    summary:
      'Complétude d’un attribut (JSON attribus) : % d’infras où la clé est renseignée dans le périmètre.',
    description: `
Paramètres :
- attr (obligatoire) — ex: "lits_total"
- typeId (optionnel) — restreindre à un type précis
- level + id — périmètre.
    `,
  })
  async completeness(@Query() q: CompletenessDto) {
    return await this.service.completeness(q);
  }

  @Get('coverage')
  @ApiOperation({
    summary:
      'Couverture : part des communes qui possèdent au moins 1 infrastructure du type demandé.',
    description: `
Paramètres :
- typeId (recommandé)
- level + id (zone à évaluer).
    `,
  })
  async coverage(@Query() q: CoverageDto) {
    return await this.service.coverage(q);
  }

  /* G — Attributs spécifiques (JSON) */
  @Get('attributes/distribution')
  @ApiOperation({
    summary:
      'Distribution d’un attribut JSON (attribus) : comptage par valeur (ex. etat_global=bon/moyen/dégradé).',
    description: `
Paramètres :
- attr (obligatoire)
- typeId (optionnel)
- level + id (périmètre).
    `,
  })
  async attrDist(@Query() q: AttrDistributionDto) {
    return await this.service.attrDistribution(q);
  }

  @Get('attributes/crosstab')
  @ApiOperation({
    summary:
      'Tableau croisé (crosstab) entre deux attributs JSON (attrA × attrB) avec le nombre d’infras par combinaison.',
    description: `
Paramètres :
- attrA, attrB (obligatoires)
- typeId (optionnel)
- level + id (périmètre).
    `,
  })
  async attrCross(@Query() q: AttrCrosstabDto) {
    return await this.service.attrCrosstab(q);
  }

  /* H — Fraîcheur & Activité */
  @Get('freshness')
  @ApiOperation({
    summary:
      'Fraîcheur des données : part d’infrastructures mises à jour dans les X derniers jours (max_age_days).',
    description: `
Paramètres :
- max_age_days (défaut 90)
- level + id (périmètre).
    `,
  })
  async freshness(@Query() q: FreshnessDto) {
    return await this.service.freshness(q);
  }

  @Get('activity')
  @ApiOperation({
    summary:
      'Activité par jour : nombre de créations et de mises à jour quotidiennes dans une période et un périmètre.',
    description: `
Paramètres :
- from/to (optionnels ; défaut : 30 derniers jours)
- level + id (périmètre).
    `,
  })
  async activity(@Query() q: any) {
    return await this.service.activity(q);
  }
}
