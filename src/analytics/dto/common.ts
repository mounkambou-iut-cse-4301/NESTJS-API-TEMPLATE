// import { ApiPropertyOptional } from '@nestjs/swagger';
// import { IsInt, IsOptional, IsString, Min } from 'class-validator';

// export class ScopeDto {
//   @ApiPropertyOptional({ enum: ['country','region','departement','arrondissement','commune'], default: 'country' })
//   @IsOptional() @IsString() level?: 'country'|'region'|'departement'|'arrondissement'|'commune' = 'country';

//   @ApiPropertyOptional() @IsOptional() @IsInt() regionId?: number;
//   @ApiPropertyOptional() @IsOptional() @IsInt() departementId?: number;
//   @ApiPropertyOptional() @IsOptional() @IsInt() arrondissementId?: number;
//   @ApiPropertyOptional() @IsOptional() @IsInt() communeId?: number;
// }

// export class PagingDto {
//   @ApiPropertyOptional({ default: 1 }) @IsOptional() @IsInt() @Min(1) page?: number = 1;
//   @ApiPropertyOptional({ default: 50 }) @IsOptional() @IsInt() @Min(1) pageSize?: number = 50;
// }

// export class RangeDto {
//   @ApiPropertyOptional({ description: 'YYYY-MM-DD' }) @IsOptional() @IsString() from?: string;
//   @ApiPropertyOptional({ description: 'YYYY-MM-DD' }) @IsOptional() @IsString() to?: string;
// }

// export class GroupByDto extends ScopeDto {
//   @ApiPropertyOptional({ enum: ['type','domaine','mois','trimestre','annee'] })
//   @IsOptional() @IsString() group_by?: 'type'|'domaine'|'mois'|'trimestre'|'annee';
// }
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ScopeDto {
  @ApiPropertyOptional({ enum: ['country','region','departement','arrondissement','commune'], default: 'country' })
  @IsOptional() @IsString()
  level?: 'country'|'region'|'departement'|'arrondissement'|'commune' = 'country';

  @ApiPropertyOptional() @IsOptional() @IsInt() regionId?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() departementId?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() arrondissementId?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() communeId?: number;
}

export class PagingDto {
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 }) @IsOptional() @IsInt() @Min(1)
  pageSize?: number = 50;
}

export class RangeDto {
  @ApiPropertyOptional({ description: 'YYYY-MM-DD' }) @IsOptional() @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD' }) @IsOptional() @IsString()
  to?: string;
}

export class GroupByDto extends ScopeDto {
  @ApiPropertyOptional({ enum: ['type','domaine','mois','trimestre','annee'] })
  @IsOptional() @IsString()
  group_by?: 'type'|'domaine'|'mois'|'trimestre'|'annee';
}
