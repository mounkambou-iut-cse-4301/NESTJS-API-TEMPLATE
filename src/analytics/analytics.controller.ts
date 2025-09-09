// // import { Controller, Get, Query } from '@nestjs/common';
// // import { ApiOperation, ApiTags } from '@nestjs/swagger';
// // import { AnalyticsService } from './analytics.service';
// // import {
// //   OverviewDto, DistributionTypesDto, DistributionDomainesDto, TimeseriesDto,
// //   TopCommunesDto, TopTypesDto, ChoroplethDto, HeatmapAnalyticsDto,
// //   CompletenessDto, CoverageDto, AttrDistributionDto, AttrCrosstabDto,
// //   FreshnessDto
// // } from './dto/specific';

// // @ApiTags('Analytics')
// // @Controller('api/v1/analytics')
// // export class AnalyticsController {
// //   constructor(private readonly service: AnalyticsService) {}

// //   /* A — Vue d’ensemble */
// //   @Get('overview')
// //   @ApiOperation({
// //     summary:
// //       'Vue d’ensemble : totaux d’infrastructures, nb de communes actives et répartition SIMPLE/COMPLEXE pour un périmètre (pays/région/département/arrondissement/commune).',
// //     description: `
// // Retourne un résumé rapide dans le périmètre choisi.

// // • total_infrastructures : nombre total d’infras.
// // • communes_actives : communes avec ≥1 infra.
// // • repartition : parts "SIMPLE" vs "COMPLEXE".

// // Filtres (un seul niveau à la fois) :
// // - level=country|region|departement|arrondissement|commune
// // - regionId / departementId / arrondissementId / communeId (selon level)
// //     `,
// //   })
// //   async overview(@Query() q: OverviewDto) {
// //     return await this.service.overview(q);
// //   }

// //   /* B — Répartition par type / domaine */
// //   @Get('distribution/infrastructure-types')
// //   @ApiOperation({
// //     summary:
// //       'Répartition par type d’infrastructure : compte par type dans le périmètre sélectionné (utile pour graphiques barres).',
// //     description: `
// // Compte des infrastructures par id de type (TypeInfrastructure).
// // Même logique de périmètre que "overview".
// //     `,
// //   })
// //   async distTypes(@Query() q: DistributionTypesDto) {
// //     return await this.service.distributionTypes(q);
// //   }

// //   @Get('distribution/domaines')
// //   @ApiOperation({
// //     summary:
// //       'Répartition par domaine : volume d’infrastructures par domaine fonctionnel (santé, éducation, ...).',
// //     description: `
// // Compte des infrastructures par Domaine dans la zone choisie (level + id).
// //     `,
// //   })
// //   async distDomaines(@Query() q: DistributionDomainesDto) {
// //     return await this.service.distributionDomaines(q);
// //   }

// //   /* C — Séries temporelles */
// //   @Get('timeseries/infrastructures-created')
// //   @ApiOperation({
// //     summary:
// //       'Séries temporelles (créations) : nombre d’infras créées par mois/trimestre/année dans un périmètre et une période.',
// //     description: `
// // Paramètres :
// // - group_by=mois|trimestre|annee (défaut: mois)
// // - from=YYYY-MM-DD, to=YYYY-MM-DD (optionnels)
// // - level + id pour cadrer la zone.
// //     `,
// //   })
// //   async tsCreated(@Query() q: TimeseriesDto) {
// //     return await this.service.timeseriesCreated(q);
// //   }

// //   @Get('timeseries/updates')
// //   @ApiOperation({
// //     summary:
// //       'Séries temporelles (mises à jour) : nombre d’infras modifiées par mois/trimestre/année dans le périmètre.',
// //     description: `
// // Même principe que "créations" mais basé sur updated_at.
// //     `,
// //   })
// //   async tsUpdates(@Query() q: TimeseriesDto) {
// //     return await this.service.timeseriesUpdates(q);
// //   }

// //   /* D — Tops */
// //   @Get('top/communes')
// //   @ApiOperation({
// //     summary:
// //       'Top communes : classement des communes avec le plus d’infrastructures (limitable, filtrable par périmètre).',
// //     description: `
// // Paramètres :
// // - limit (défaut 10)
// // - level + id (optionnels) pour restreindre la zone.
// //     `,
// //   })
// //   async topCommunes(@Query() q: TopCommunesDto) {
// //     return await this.service.topCommunes(q);
// //   }

// //   @Get('top/types')
// //   @ApiOperation({
// //     summary:
// //       'Top types : classement des types d’infrastructure les plus présents (limitable, périmètre optionnel).',
// //     description: `
// // Paramètres :
// // - limit (défaut 10)
// // - level + id (pour limiter la zone).
// //     `,
// //   })
// //   async topTypes(@Query() q: TopTypesDto) {
// //     return await this.service.topTypes(q);
// //   }

// //   /* E — Cartes thématiques */
// //   @Get('map/choropleth')
// //   @ApiOperation({
// //     summary:
// //       'Carte choropleth : nombre d’infrastructures par commune (prêt pour colorer une carte).',
// //     description: `
// // Renvoie la valeur par commune dans le périmètre choisi.
// //     `,
// //   })
// //   async choropleth(@Query() q: ChoroplethDto) {
// //     return await this.service.mapChoropleth(q);
// //   }

// //   @Get('map/heatmap')
// //   @ApiOperation({
// //     summary:
// //       'Carte heatmap : liste des points (lat, lon) d’infrastructures, filtrables par type et période.',
// //     description: `
// // Paramètres :
// // - typeId (optionnel), from/to (optionnels), level + id (périmètre).
// //     `,
// //   })
// //   async heatmap(@Query() q: HeatmapAnalyticsDto) {
// //     return await this.service.mapHeatmap(q);
// //   }

// //   /* F — Qualité des données */
// //   @Get('completeness')
// //   @ApiOperation({
// //     summary:
// //       'Complétude d’un attribut (JSON attribus) : % d’infras où la clé est renseignée dans le périmètre.',
// //     description: `
// // Paramètres :
// // - attr (obligatoire) — ex: "lits_total"
// // - typeId (optionnel) — restreindre à un type précis
// // - level + id — périmètre.
// //     `,
// //   })
// //   async completeness(@Query() q: CompletenessDto) {
// //     return await this.service.completeness(q);
// //   }

// //   @Get('coverage')
// //   @ApiOperation({
// //     summary:
// //       'Couverture : part des communes qui possèdent au moins 1 infrastructure du type demandé.',
// //     description: `
// // Paramètres :
// // - typeId (recommandé)
// // - level + id (zone à évaluer).
// //     `,
// //   })
// //   async coverage(@Query() q: CoverageDto) {
// //     return await this.service.coverage(q);
// //   }

// //   /* G — Attributs spécifiques (JSON) */
// //   @Get('attributes/distribution')
// //   @ApiOperation({
// //     summary:
// //       'Distribution d’un attribut JSON (attribus) : comptage par valeur (ex. etat_global=bon/moyen/dégradé).',
// //     description: `
// // Paramètres :
// // - attr (obligatoire)
// // - typeId (optionnel)
// // - level + id (périmètre).
// //     `,
// //   })
// //   async attrDist(@Query() q: AttrDistributionDto) {
// //     return await this.service.attrDistribution(q);
// //   }

// //   @Get('attributes/crosstab')
// //   @ApiOperation({
// //     summary:
// //       'Tableau croisé (crosstab) entre deux attributs JSON (attrA × attrB) avec le nombre d’infras par combinaison.',
// //     description: `
// // Paramètres :
// // - attrA, attrB (obligatoires)
// // - typeId (optionnel)
// // - level + id (périmètre).
// //     `,
// //   })
// //   async attrCross(@Query() q: AttrCrosstabDto) {
// //     return await this.service.attrCrosstab(q);
// //   }

// //   /* H — Fraîcheur & Activité */
// //   @Get('freshness')
// //   @ApiOperation({
// //     summary:
// //       'Fraîcheur des données : part d’infrastructures mises à jour dans les X derniers jours (max_age_days).',
// //     description: `
// // Paramètres :
// // - max_age_days (défaut 90)
// // - level + id (périmètre).
// //     `,
// //   })
// //   async freshness(@Query() q: FreshnessDto) {
// //     return await this.service.freshness(q);
// //   }

// //   @Get('activity')
// //   @ApiOperation({
// //     summary:
// //       'Activité par jour : nombre de créations et de mises à jour quotidiennes dans une période et un périmètre.',
// //     description: `
// // Paramètres :
// // - from/to (optionnels ; défaut : 30 derniers jours)
// // - level + id (périmètre).
// //     `,
// //   })
// //   async activity(@Query() q: any) {
// //     return await this.service.activity(q);
// //   }
// // }


// import { Controller, Get, Param, ParseIntPipe, Query, Req, UseGuards } from '@nestjs/common';
// import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
// import { AnalyticsService } from './analytics.service';
// import {
//   OverviewDto, DistributionTypesDto, DistributionDomainesDto, TimeseriesDto,
//   TopCommunesDto, TopTypesDto, ChoroplethDto, HeatmapAnalyticsDto,
//   CompletenessDto, CoverageDto, AttrDistributionDto, AttrCrosstabDto,
//   FreshnessDto
// } from './dto/specific';
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
// import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';
// import { TypeStatsGeoQueryDto } from './dto/type-stats-geo.query.dto';
// @ApiBearerAuth('JWT-auth')
// @UseGuards(JwtAuthGuard, NotBlockedGuard)
// @ApiTags('Analytics')
// @Controller('api/v1/analytics')
// export class AnalyticsController {
//   constructor(private readonly service: AnalyticsService) {}

//   @Get('types/:typeId/stats')
//   @ApiOperation({
//     summary: 'Statistiques pour un type d’infrastructure',
//     description:
//       "Totaux + répartition par etat + stats par attribut (number/boolean/enum). " +
//       "Filtres optionnels: regionId, departementId, arrondissementId. " +
//       "Si req.user.communeId est présent, on scope automatiquement à l’arrondissement de cette commune.",
//   })
//   @ApiParam({ name: 'typeId', type: Number, required: true })
//   async typeStatsByGeo(
//     @Param('typeId', ParseIntPipe) typeId: number,
//     @Query() q: TypeStatsGeoQueryDto,
//     @Req() req: any, // 👈 on récupère le user ici
//   ) {
//     // 👇 on propage req au service pour qu’il applique le scope arrondissement depuis user.communeId si présent
//     return this.service.typeStatsByGeo({ typeId, ...q }, req);
//   }

//   @Get('infrastructures/:infraId/type-stats')
//   @ApiOperation({
//     summary: 'Statistiques du type à partir d’un infraId',
//     description:
//       "Récupère le typeId de l’infrastructure. " +
//       "Si les filtres géo ne sont pas fournis, on utilise la géo de l’infra. " +
//       "Si req.user.communeId est présent, on scope automatiquement à l’arrondissement de cette commune.",
//   })
//   @ApiParam({ name: 'infraId', type: String, required: true })
//   async typeStatsFromInfra(
//     @Param('infraId') infraId: string,
//     @Query() q: TypeStatsGeoQueryDto,
//     @Req() req: any, // 👈 idem
//   ) {
//     return this.service.typeStatsByGeoFromInfra(infraId, q, req);
//   }

//   /* A — Vue d’ensemble */
//   @Get('overview')
//   @ApiOperation({
//     summary:
//       'Obtenir un aperçu global des infrastructures, incluant le total d’infrastructures, le nombre de communes actives, et la répartition entre infrastructures simples et complexes pour un périmètre donné (pays, région, département, arrondissement, commune).',
//     description: `
// Retourne un résumé rapide dans le périmètre choisi.

// • total_infrastructures : nombre total d’infras.
// • communes_actives : communes avec ≥1 infra.
// • repartition : parts "SIMPLE" vs "COMPLEXE".

// Filtres (un seul niveau à la fois) :
// - level=country|region|departement|arrondissement|commune
// - regionId / departementId / arrondissementId / communeId (selon level)

// Si l’utilisateur est connecté et possède une commune (req.user.communeId), la réponse est automatiquement restreinte à cette commune.
//     `,
//   })
//   async overview(@Query() q: OverviewDto, @Req() req: any) {
//     return await this.service.overview(q, req);
//   }

//   /* B — Répartition par type / domaine */
//   @Get('distribution/infrastructure-types')
//   @ApiOperation({
//     summary: 'Obtenir la répartition des infrastructures par type dans le périmètre sélectionné, en tenant compte des communes actives si l’utilisateur est connecté.',
//     description: `Compte des infrastructures par type dans le périmètre. Si req.user.communeId est présent, on restreint automatiquement à cette commune.`,
//   })
//   async distTypes(@Query() q: DistributionTypesDto, @Req() req: any) {
//     return await this.service.distributionTypes(q, req);
//   }

//   @Get('distribution/domaines')
//   @ApiOperation({
//     summary: 'Obtenir la répartition des infrastructures par domaine fonctionnel, restreinte à la commune de l’utilisateur si applicable.',
//     description: `Compte des infrastructures par domaine fonctionnel. Restreint à req.user.communeId si présent.`,
//   })
//   async distDomaines(@Query() q: DistributionDomainesDto, @Req() req: any) {
//     return await this.service.distributionDomaines(q, req);
//   }

//   /* C — Séries temporelles */
//   @Get('timeseries/infrastructures-created')
//   @ApiOperation({
//     summary: 'Obtenir des séries temporelles des créations d’infrastructures, groupées par mois, trimestre ou année.',
//     description: `group_by=mois|trimestre|annee ; from/to ; périmètre + scoping à la commune de l’utilisateur si disponible.`,
//   })
//   async tsCreated(@Query() q: TimeseriesDto, @Req() req: any) {
//     return await this.service.timeseriesCreated(q, req);
//   }

//   @Get('timeseries/updates')
//   @ApiOperation({
//     summary: 'Obtenir des séries temporelles des mises à jour d’infrastructures, avec un scoping automatique selon la commune de l’utilisateur.',
//     description: `Même principe que "créations", scoping auto par commune si req.user.communeId.`,
//   })
//   async tsUpdates(@Query() q: TimeseriesDto, @Req() req: any) {
//     return await this.service.timeseriesUpdates(q, req);
//   }

//   /* D — Tops */
//   @Get('top/communes')
//   @ApiOperation({
//     summary: 'Obtenir le classement des communes selon le nombre d’infrastructures, avec une restriction automatique à la commune de l’utilisateur si applicable.',
//     description: `Classement des communes par nombre d’infras. Si req.user.communeId, la requête est déjà bornée à cette commune → résultat focalisé.`,
//   })
//   async topCommunes(@Query() q: TopCommunesDto, @Req() req: any) {
//     return await this.service.topCommunes(q, req);
//   }

//   @Get('top/types')
//   @ApiOperation({
//     summary: 'Obtenir le classement des types d’infrastructures les plus fréquents, restreint à la commune de l’utilisateur si applicable.',
//     description: `Classement des types les plus présents ; restreint à req.user.communeId si présent.`,
//   })
//   async topTypes(@Query() q: TopTypesDto, @Req() req: any) {
//     return await this.service.topTypes(q, req);
//   }

//   /* E — Cartes thématiques */
//   @Get('map/choropleth')
//   @ApiOperation({
//     summary: 'Obtenir une carte choropleth représentant le nombre d’infrastructures par commune dans le périmètre sélectionné.',
//     description: `Renvoie le nombre d’infras par commune dans le périmètre. Si req.user.communeId, scoping automatique.`,
//   })
//   async choropleth(@Query() q: ChoroplethDto, @Req() req: any) {
//     return await this.service.mapChoropleth(q, req);
//   }

//   @Get('map/heatmap')
//   @ApiOperation({
//     summary: 'Obtenir une heatmap des infrastructures selon leur localisation (latitude, longitude), filtrable par type et période.',
//     description: `Filtrable par type et période ; scoping auto par commune si utilisateur connecté avec commune.`,
//   })
//   async heatmap(@Query() q: HeatmapAnalyticsDto, @Req() req: any) {
//     return await this.service.mapHeatmap(q, req);
//   }

//   /* F — Qualité des données */
//   @Get('completeness')
//   @ApiOperation({
//     summary: 'Obtenir le pourcentage d’infrastructures où un attribut JSON spécifique est renseigné, avec un scoping automatique si l’utilisateur a une commune.',
//     description: `Calcule le % d’infras où la clé (attribus) est renseignée. Scoping auto par commune si disponible.`,
//   })
//   async completeness(@Query() q: CompletenessDto, @Req() req: any) {
//     return await this.service.completeness(q, req);
//   }

//   @Get('coverage')
//   @ApiOperation({
//     summary: 'Obtenir la part des communes ayant au moins une infrastructure d’un type spécifique, restreint à la commune de l’utilisateur si applicable.',
//     description: `Part des communes couvertes. Scoping auto par commune si req.user.communeId.`,
//   })
//   async coverage(@Query() q: CoverageDto, @Req() req: any) {
//     return await this.service.coverage(q, req);
//   }

//   /* G — Attributs spécifiques */
//   @Get('attributes/distribution')
//   @ApiOperation({
//     summary: 'Obtenir la distribution des valeurs d’un attribut JSON spécifique, avec une restriction automatique à la commune de l’utilisateur si présente.',
//     description: `Comptage par valeur d’une clé attribus ; restreint à la commune de l’utilisateur si présente.`,
//   })
//   async attrDist(@Query() q: AttrDistributionDto, @Req() req: any) {
//     return await this.service.attrDistribution(q, req);
//   }

//   @Get('attributes/crosstab')
//   @ApiOperation({
//     summary: 'Obtenir un tableau croisé entre deux attributs JSON, avec un scoping automatique selon la commune de l’utilisateur.',
//     description: `Tableau croisé attrA × attrB ; scoping auto par commune si disponible.`,
//   })
//   async attrCross(@Query() q: AttrCrosstabDto, @Req() req: any) {
//     return await this.service.attrCrosstab(q, req);
//   }

//   /* H — Fraîcheur & Activité */
//   @Get('freshness')
//   @ApiOperation({
//     summary: 'Obtenir la part des infrastructures mises à jour dans les derniers X jours, avec un scoping automatique selon la commune de l’utilisateur si disponible.',
//     description: `Part des infras mises à jour dans les X derniers jours ; scoping auto par commune si possible.`,
//   })
//   async freshness(@Query() q: FreshnessDto, @Req() req: any) {
//     return await this.service.freshness(q, req);
//   }

//   @Get('activity')
//   @ApiOperation({
//     summary: 'Obtenir une série d’activités (créations et mises à jour) par jour, avec un scoping automatique si l’utilisateur a une commune.',
//     description: `Série quotidienne ; scoping auto par commune si req.user.communeId.`,
//   })
//   async activity(@Query() q: any, @Req() req: any) {
//     return await this.service.activity(q, req);
//   }
// }
import { Controller, Get, Param, ParseIntPipe, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import {
  OverviewDto, DistributionTypesDto, DistributionDomainesDto, TimeseriesDto,
  TopCommunesDto, TopTypesDto, ChoroplethDto, HeatmapAnalyticsDto,
  CompletenessDto, CoverageDto, AttrDistributionDto, AttrCrosstabDto,
  FreshnessDto
} from './dto/specific';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotBlockedGuard } from 'src/auth/guards/not-blocked.guard';
import { TypeStatsGeoQueryDto } from './dto/type-stats-geo.query.dto';

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, NotBlockedGuard)
@ApiTags('Analytics')
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('types/:typeId/stats')
  @ApiOperation({
    summary: 'Statistiques pour un type d’infrastructure',
    description:
      "Totaux + répartition par etat + stats par attribut (number/boolean/enum). " +
      "Filtres optionnels: regionId, departementId, arrondissementId. " +
      "Si req.user.communeId est présent, on scope automatiquement à l’arrondissement de cette commune.",
  })
  @ApiParam({ name: 'typeId', type: Number, required: true })
  async typeStatsByGeo(
    @Param('typeId', ParseIntPipe) typeId: number,
    @Query() q: TypeStatsGeoQueryDto,
    @Req() req: any,
  ) {
    return this.service.typeStatsByGeo({ typeId, ...q }, req);
  }

  @Get('infrastructures/:infraId/type-stats')
  @ApiOperation({
    summary: 'Statistiques du type à partir d’un infraId',
    description:
      "Récupère le typeId de l’infrastructure. " +
      "Si les filtres géo ne sont pas fournis, on utilise la géo de l’infra. " +
      "Si req.user.communeId est présent, on scope automatiquement à l’arrondissement de cette commune.",
  })
  @ApiParam({ name: 'infraId', type: String, required: true })
  async typeStatsFromInfra(
    @Param('infraId') infraId: string,
    @Query() q: TypeStatsGeoQueryDto,
    @Req() req: any,
  ) {
    return this.service.typeStatsByGeoFromInfra(infraId, q, req);
  }

  /* A — Vue d’ensemble */
  @Get('overview')
  @ApiOperation({
    summary:
      'Obtenir un aperçu global des infrastructures, incluant le total d’infrastructures, le nombre de communes actives, et la répartition entre infrastructures simples et complexes pour un périmètre donné (pays, région, département, arrondissement, commune).',
    description: `
Retourne un résumé rapide dans le périmètre choisi.

• total_infrastructures : nombre total d’infras.
• communes_actives : communes avec ≥1 infra.
• repartition : parts "SIMPLE" vs "COMPLEXE".

Filtres (un seul niveau à la fois) :
- level=country|region|departement|arrondissement|commune
- regionId / departementId / arrondissementId / communeId (selon level)

Si l’utilisateur est connecté et possède une commune (req.user.communeId), la réponse est automatiquement restreinte à cette commune.
    `,
  })
  async overview(@Query() q: OverviewDto, @Req() req: any) {
    return this.service.overview(q, req);
  }

  /* B — Répartition par type / domaine */
  @Get('distribution/infrastructure-types')
  @ApiOperation({
    summary: 'Obtenir la répartition des infrastructures par type dans le périmètre sélectionné, en tenant compte des communes actives si l’utilisateur est connecté.',
    description: `Compte des infrastructures par type dans le périmètre. Si req.user.communeId est présent, on restreint automatiquement à cette commune.`,
  })
  async distTypes(@Query() q: DistributionTypesDto, @Req() req: any) {
    return this.service.distributionTypes(q, req);
  }

  @Get('distribution/domaines')
  @ApiOperation({
    summary: 'Obtenir la répartition des infrastructures par domaine fonctionnel, restreinte à la commune de l’utilisateur si applicable.',
    description: `Compte des infrastructures par domaine fonctionnel. Restreint à req.user.communeId si présent.`,
  })
  async distDomaines(@Query() q: DistributionDomainesDto, @Req() req: any) {
    return this.service.distributionDomaines(q, req);
  }

  /* C — Séries temporelles */
  @Get('timeseries/infrastructures-created')
  @ApiOperation({
    summary: 'Obtenir des séries temporelles des créations d’infrastructures, groupées par mois, trimestre ou année.',
    description: `group_by=mois|trimestre|annee ; from/to ; périmètre + scoping à la commune de l’utilisateur si disponible.`,
  })
  async tsCreated(@Query() q: TimeseriesDto, @Req() req: any) {
    return this.service.timeseriesCreated(q, req);
  }

  @Get('timeseries/updates')
  @ApiOperation({
    summary: 'Obtenir des séries temporelles des mises à jour d’infrastructures, avec un scoping automatique selon la commune de l’utilisateur.',
    description: `Même principe que "créations", scoping auto par commune si req.user.communeId.`,
  })
  async tsUpdates(@Query() q: TimeseriesDto, @Req() req: any) {
    return this.service.timeseriesUpdates(q, req);
  }

  /* D — Tops */
  @Get('top/communes')
  @ApiOperation({
    summary: 'Obtenir le classement des communes selon le nombre d’infrastructures, avec une restriction automatique à la commune de l’utilisateur si applicable.',
    description: `Classement des communes par nombre d’infras. Si req.user.communeId, la requête est déjà bornée à cette commune → résultat focalisé.`,
  })
  async topCommunes(@Query() q: TopCommunesDto, @Req() req: any) {
    return this.service.topCommunes(q, req);
  }

  @Get('top/types')
  @ApiOperation({
    summary: 'Obtenir le classement des types d’infrastructures les plus fréquents, restreint à la commune de l’utilisateur si applicable.',
    description: `Classement des types les plus présents ; restreint à req.user.communeId si présent.`,
  })
  async topTypes(@Query() q: TopTypesDto, @Req() req: any) {
    return this.service.topTypes(q, req);
  }

  /* E — Cartes thématiques */
  @Get('map/choropleth')
  @ApiOperation({
    summary: 'Obtenir une carte choropleth représentant le nombre d’infrastructures par commune dans le périmètre sélectionné.',
    description: `Renvoie le nombre d’infras par commune dans le périmètre. Si req.user.communeId, scoping automatique.`,
  })
  async choropleth(@Query() q: ChoroplethDto, @Req() req: any) {
    return this.service.mapChoropleth(q, req);
  }

  @Get('map/heatmap')
  @ApiOperation({
    summary: 'Obtenir une heatmap des infrastructures selon leur localisation (latitude, longitude), filtrable par type et période.',
    description: `Filtrable par type et période ; scoping auto par commune si utilisateur connecté avec commune.`,
  })
  async heatmap(@Query() q: HeatmapAnalyticsDto, @Req() req: any) {
    return this.service.mapHeatmap(q, req);
  }

  /* F — Qualité des données */
  @Get('completeness')
  @ApiOperation({
    summary: 'Obtenir le pourcentage d’infrastructures où un attribut JSON spécifique est renseigné, avec un scoping automatique si l’utilisateur a une commune.',
    description: `Calcule le % d’infras où la clé (attribus) est renseignée. Scoping auto par commune si disponible.`,
  })
  async completeness(@Query() q: CompletenessDto, @Req() req: any) {
    return this.service.completeness(q, req);
  }

  @Get('coverage')
  @ApiOperation({
    summary: 'Obtenir la part des communes ayant au moins une infrastructure d’un type spécifique, restreint à la commune de l’utilisateur si applicable.',
    description: `Part des communes couvertes. Scoping auto par commune si req.user.communeId.`,
  })
  async coverage(@Query() q: CoverageDto, @Req() req: any) {
    return this.service.coverage(q, req);
  }

  /* G — Attributs spécifiques */
  @Get('attributes/distribution')
  @ApiOperation({
    summary: 'Obtenir la distribution des valeurs d’un attribut JSON spécifique, avec une restriction automatique à la commune de l’utilisateur si présente.',
    description: `Comptage par valeur d’une clé attribus ; restreint à la commune de l’utilisateur si présente.`,
  })
  async attrDist(@Query() q: AttrDistributionDto, @Req() req: any) {
    return this.service.attrDistribution(q, req);
  }

  @Get('attributes/crosstab')
  @ApiOperation({
    summary: 'Obtenir un tableau croisé entre deux attributs JSON, avec un scoping automatique selon la commune de l’utilisateur.',
    description: `Tableau croisé attrA × attrB ; scoping auto par commune si disponible.`,
  })
  async attrCross(@Query() q: AttrCrosstabDto, @Req() req: any) {
    return this.service.attrCrosstab(q, req);
  }

  /* H — Fraîcheur & Activité */
  @Get('freshness')
  @ApiOperation({
    summary: 'Obtenir la part des infrastructures mises à jour dans les derniers X jours, avec un scoping automatique selon la commune de l’utilisateur si disponible.',
    description: `Part des infras mises à jour dans les X derniers jours ; scoping auto par commune si possible.`,
  })
  async freshness(@Query() q: FreshnessDto, @Req() req: any) {
    return this.service.freshness(q, req);
  }

  @Get('activity')
  @ApiOperation({
    summary: 'Obtenir une série d’activités (créations et mises à jour) par jour, avec un scoping automatique si l’utilisateur a une commune.',
    description: `Série quotidienne ; scoping auto par commune si req.user.communeId.`,
  })
  async activity(@Query() q: any, @Req() req: any) {
    return this.service.activity(q, req);
  }
}
