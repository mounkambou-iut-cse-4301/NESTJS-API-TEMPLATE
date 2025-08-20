// src/infrastructures/dto/infra-stats.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class BaseScopeDto {
  @ApiPropertyOptional({ description: 'Filtre regionId' })
  @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1)
  regionId?: number;

  @ApiPropertyOptional({ description: 'Filtre departementId' })
  @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1)
  departementId?: number;

  @ApiPropertyOptional({ description: 'Filtre arrondissementId' })
  @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1)
  arrondissementId?: number;

  @ApiPropertyOptional({ description: 'Filtre communeId' })
  @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1)
  communeId?: number;

  @ApiPropertyOptional({ description: 'Filtrer par type (SIMPLE|COMPLEXE)', enum: ['SIMPLE','COMPLEXE'] })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsOptional() @IsIn(['SIMPLE','COMPLEXE'])
  type?: 'SIMPLE'|'COMPLEXE';

  @ApiPropertyOptional({ description: 'Filtrer par TypeInfrastructure (FK)', example: 2 })
  @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1)
  typeId?: number;

  @ApiPropertyOptional({ description: 'Filtrer par domaine (FK)', example: 1 })
  @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1)
  domaineId?: number;

  @ApiPropertyOptional({ description: 'Filtrer par compétence (FK)', example: 3 })
  @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1)
  competenceId?: number;
}

/** 1) Résumé: total + par etat + par type */
export class InfraSummaryDto extends BaseScopeDto {}

/** 2) Groupements génériques */
export class InfraGroupDto extends BaseScopeDto {
  @ApiPropertyOptional({ description: 'Dimension de groupement', enum: ['type','region','departement','commune'] })
  @Transform(({ value }) => value?.toString().toLowerCase())
  @IsIn(['type','region','departement','commune'])
  group: 'type'|'region'|'departement'|'commune';

  @ApiPropertyOptional({ description: 'Inclure la ventilation par attribus.etat', default: true })
  @Transform(({ value }) => value === undefined ? true : (value === 'true' || value === true))
  @IsOptional() @IsBoolean()
  include_etat?: boolean;

  @ApiPropertyOptional({ description: 'Limiter le nombre de groupes retournés', default: 50 })
  @Transform(({ value }) => value === undefined ? 50 : Number(value))
  @IsOptional() @IsInt() @Min(1)
  limit?: number;
}

/** 3) Groupement par competenceId / domaineId */
export class InfraGroupSimpleDto extends BaseScopeDto {
  @ApiPropertyOptional({ description: 'Inclure la ventilation par attribus.etat', default: true })
  @Transform(({ value }) => value === undefined ? true : (value === 'true' || value === true))
  @IsOptional() @IsBoolean()
  include_etat?: boolean;

  @ApiPropertyOptional({ description: 'Limiter le nombre de groupes retournés', default: 50 })
  @Transform(({ value }) => value === undefined ? 50 : Number(value))
  @IsOptional() @IsInt() @Min(1)
  limit?: number;
}
