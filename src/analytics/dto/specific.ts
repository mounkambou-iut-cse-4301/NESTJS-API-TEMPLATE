// import { ApiPropertyOptional } from '@nestjs/swagger';
// import { IsInt, IsOptional, IsString } from 'class-validator';
// import { ScopeDto, RangeDto } from './common';

// export class OverviewDto extends ScopeDto {}

// export class DistributionTypesDto extends ScopeDto {}
// export class DistributionDomainesDto extends ScopeDto {}

// export class TimeseriesDto extends ScopeDto {
//   @ApiPropertyOptional({ enum: ['mois','trimestre','annee'], default: 'mois' })
//   @IsOptional() @IsString() group_by?: 'mois'|'trimestre'|'annee' = 'mois';

//   @ApiPropertyOptional() @IsOptional() @IsString() from?: string;
//   @ApiPropertyOptional() @IsOptional() @IsString() to?: string;
// }

// export class TopCommunesDto extends ScopeDto {
//   @ApiPropertyOptional({ default: 'infrastructures_count' }) @IsOptional() @IsString() metric?: string = 'infrastructures_count';
//   @ApiPropertyOptional({ default: 10 }) @IsOptional() @IsInt() limit?: number = 10;
// }
// export class TopTypesDto extends ScopeDto {
//   @ApiPropertyOptional({ default: 'count' }) @IsOptional() @IsString() metric?: string = 'count';
// }

// export class ChoroplethDto extends ScopeDto {
//   @ApiPropertyOptional({ default: 'infrastructures_count' }) @IsOptional() @IsString() metric?: string = 'infrastructures_count';
// }
// export class HeatmapAnalyticsDto extends RangeDto {
//   @ApiPropertyOptional() @IsOptional() @IsInt() typeId?: number;
// }

// export class CompletenessDto extends ScopeDto {
//   @ApiPropertyOptional() @IsOptional() @IsInt() typeId?: number;
//   @ApiPropertyOptional({ example: 'NombrePharmacie' }) @IsString() attr: string;
// }

// export class CoverageDto extends ScopeDto {
//   @ApiPropertyOptional() @IsOptional() @IsInt() typeId?: number;
// }

// export class AttrDistributionDto extends ScopeDto {
//   @ApiPropertyOptional() @IsOptional() @IsInt() typeId?: number;
//   @ApiPropertyOptional({ example: 'NombreChambre' }) attr!: string;
// }

// export class AttrCrosstabDto extends ScopeDto {
//   @ApiPropertyOptional() @IsOptional() @IsInt() typeId?: number;
//   @ApiPropertyOptional({ example: 'NombreChambre' }) attrA!: string;
//   @ApiPropertyOptional({ example: 'etat_global' }) attrB!: string;
// }

// export class FreshnessDto extends ScopeDto {
//   @ApiPropertyOptional({ default: 90 }) @IsOptional() @IsInt() max_age_days?: number = 90;
// }

// export class ActivityDto extends ScopeDto {
//   @ApiPropertyOptional({ description: 'YYYY-MM-DD' }) @IsOptional() @IsString() from?: string;
//   @ApiPropertyOptional({ description: 'YYYY-MM-DD' }) @IsOptional() @IsString() to?: string;
// }

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { ScopeDto, RangeDto } from './common';

export class OverviewDto extends ScopeDto {}

export class DistributionTypesDto extends ScopeDto {}
export class DistributionDomainesDto extends ScopeDto {}

export class TimeseriesDto extends ScopeDto {
  @ApiPropertyOptional({ enum: ['mois','trimestre','annee'], default: 'mois' })
  @IsOptional() @IsString()
  group_by?: 'mois'|'trimestre'|'annee' = 'mois';

  @ApiPropertyOptional() @IsOptional() @IsString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() to?: string;
}

export class TopCommunesDto extends ScopeDto {
  @ApiPropertyOptional({ default: 'infrastructures_count' }) @IsOptional() @IsString()
  metric?: string = 'infrastructures_count';

  @ApiPropertyOptional({ default: 10 }) @IsOptional() @IsInt()
  limit?: number = 10;
}

export class TopTypesDto extends ScopeDto {
  @ApiPropertyOptional({ default: 'count' }) @IsOptional() @IsString()
  metric?: string = 'count';
}

export class ChoroplethDto extends ScopeDto {
  @ApiPropertyOptional({ default: 'infrastructures_count' }) @IsOptional() @IsString()
  metric?: string = 'infrastructures_count';
}

export class HeatmapAnalyticsDto extends RangeDto {
  @ApiPropertyOptional() @IsOptional() @IsInt()
  typeId?: number;
}

export class CompletenessDto extends ScopeDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() typeId?: number;
  @ApiPropertyOptional({ example: 'NombrePharmacie' }) @IsString()
  attr: string;
}

export class CoverageDto extends ScopeDto {
  @ApiPropertyOptional() @IsOptional() @IsInt()
  typeId?: number;
}

export class AttrDistributionDto extends ScopeDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() typeId?: number;
  @ApiPropertyOptional({ example: 'NombreChambre' })
  attr!: string;
}

export class AttrCrosstabDto extends ScopeDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() typeId?: number;
  @ApiPropertyOptional({ example: 'NombreChambre' }) attrA!: string;
  @ApiPropertyOptional({ example: 'etat_global' })  attrB!: string;
}

export class FreshnessDto extends ScopeDto {
  @ApiPropertyOptional({ default: 90 }) @IsOptional() @IsInt()
  max_age_days?: number = 90;
}

export class ActivityDto extends ScopeDto {
  @ApiPropertyOptional({ description: 'YYYY-MM-DD' }) @IsOptional() @IsString() from?: string;
  @ApiPropertyOptional({ description: 'YYYY-MM-DD' }) @IsOptional() @IsString() to?: string;
}
