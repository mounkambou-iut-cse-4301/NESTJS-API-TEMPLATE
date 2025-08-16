import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type as T } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class UpdateComposantRecordDto {
  @ApiPropertyOptional({ example: '1', description: 'record enfant existant' })
  @IsOptional() @IsString() recordId?: string;

  @ApiPropertyOptional({ example: 'Pharmacie' }) @IsOptional() @IsString() name?: string;

  @ApiPropertyOptional({ example: 'Dispensation interne' })
  @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({ example: 'SIMPLE', enum: ['SIMPLE','COMPLEXE'] })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsOptional() @IsIn(['SIMPLE','COMPLEXE']) type?: string;

  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() existingInfrastructure?: boolean;

  @ApiPropertyOptional({ example: { lat: 0, log: 0 } }) @IsOptional() @IsObject() location?: any;
  @ApiPropertyOptional({ example: [] }) @IsOptional() @IsArray() images?: any[];
  @ApiPropertyOptional({ example: { nombreLit: 5 } }) @IsOptional() @IsObject() attribus?: any;
  @ApiPropertyOptional({ description: 'Enfants (optionnel)' }) @IsOptional() @IsArray() composant?: any[];
}

export class UpdateInfrastructureDto {
  @ApiPropertyOptional({ example: 1 }) @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1) typeId?: number;

  @ApiPropertyOptional({ example: 'Hopital de Djongolo' }) @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional({ example: 'Description mise à jour' }) @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() existing_infrastructure?: boolean;

  @ApiPropertyOptional({ example: 'COMPLEXE', enum: ['SIMPLE','COMPLEXE'] })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsOptional() @IsIn(['SIMPLE','COMPLEXE']) type?: string;

  /* Territoire */
  @ApiPropertyOptional({ example: 1 }) @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1) regionId?: number;
  @ApiPropertyOptional({ example: 1 }) @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1) departementId?: number;
  @ApiPropertyOptional({ example: 1 }) @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1) arrondissementId?: number;
  @ApiPropertyOptional({ example: 1 }) @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1) communeId?: number;

  /* Classification */
  @ApiPropertyOptional({ example: 1 }) @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1) domaineId?: number;

  @ApiPropertyOptional({ example: 2 }) @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1) sousdomaineId?: number;

  /* Données réelles */
  @ApiPropertyOptional({ example: { lat: 1111, log: 212321 } }) @IsOptional() @IsObject() location?: any;
  @ApiPropertyOptional({ example: [] }) @IsOptional() @IsArray() images?: any[];
  @ApiPropertyOptional({ example: { NombreBlocOperatoire: 2 } }) @IsOptional() @IsObject() attribus?: any;

  @ApiPropertyOptional({ type: [UpdateComposantRecordDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @T(() => UpdateComposantRecordDto)
  composant?: UpdateComposantRecordDto[];
}
