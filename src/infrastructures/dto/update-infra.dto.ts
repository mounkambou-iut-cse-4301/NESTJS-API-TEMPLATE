import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type as T } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class ComposantUpdateDto {
  @ApiPropertyOptional({ example: 'Pharmacie' }) @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional({ example: 'Dispensation interne' }) @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({ example: 'SIMPLE', enum: ['SIMPLE','COMPLEXE'] })
  @IsOptional() @IsIn(['SIMPLE','COMPLEXE']) type?: string;

  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() existingInfrastructure?: boolean;
  @ApiPropertyOptional({ example: { lat: 0, log: 0 } }) @IsOptional() @IsObject() location?: any;
  @ApiPropertyOptional({ example: [] }) @IsOptional() @IsArray() images?: any[];
  @ApiPropertyOptional({ example: { nombreLit: 5 } }) @IsOptional() @IsObject() attribus?: any;
  @ApiPropertyOptional() @IsOptional() @IsArray() composant?: any[];
}

export class UpdateInfrastructureDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1)
  typeId?: number;

  @ApiPropertyOptional({ example: 'Nouvel intitulé' }) @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Description MAJ' }) @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean()
  existing_infrastructure?: boolean;

  @ApiPropertyOptional({ example: 'COMPLEXE', enum: ['SIMPLE','COMPLEXE'] })
  @IsOptional() @IsIn(['SIMPLE','COMPLEXE'])
  type?: string;

  /* Territoire */
  @ApiPropertyOptional({ example: 2 }) @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) regionId?: number;
  @ApiPropertyOptional({ example: 12 }) @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) departementId?: number;
  @ApiPropertyOptional({ example: 68 }) @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) arrondissementId?: number;
  @ApiPropertyOptional({ example: 2 }) @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) communeId?: number;

  /* Créateur (modif éventuelle) */
  @ApiPropertyOptional({ example: 7 })
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1)
  utilisateurId?: number;

  /* Classification */
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) domaineId?: number;
  @ApiPropertyOptional({ example: 2 }) @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) sousdomaineId?: number;

  /* Données réelles */
  @ApiPropertyOptional({ example: { lat: 3.8615, log: 11.5164 } }) @IsOptional() @IsObject() location?: any;
  @ApiPropertyOptional({ example: ['data:image/jpeg;base64,...'] }) @IsOptional() @IsArray() images?: any[];
  @ApiPropertyOptional({ example: { NombrePharmacie: 1 } }) @IsOptional() @IsObject() attribus?: any;

  @ApiPropertyOptional({ type: [ComposantUpdateDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @T(() => ComposantUpdateDto)
  composant?: ComposantUpdateDto[];
}
