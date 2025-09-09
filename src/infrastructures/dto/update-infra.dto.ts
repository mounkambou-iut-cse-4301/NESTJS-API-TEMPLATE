// src/infrastructures/dto/update-infra.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ComponentInput } from './create-infra.dto';

export class UpdateInfrastructureDto {
  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  typeId?: number;

  @ApiPropertyOptional({ example: 'Nouveau nom' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ['SIMPLE', 'COMPLEXE'], example: 'COMPLEXE' })
  @IsOptional()
  @IsEnum(['SIMPLE', 'COMPLEXE'])
  type?: 'SIMPLE' | 'COMPLEXE';

  @ApiPropertyOptional({ example: 'Description MAJ' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  regionId?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  departementId?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  arrondissementId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  communeId?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  domaineId?: number;

  @ApiPropertyOptional({ example: 21 })
  @IsOptional()
  @IsInt()
  sousdomaineId?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  competenceId?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @IsInt()
  utilisateurId?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  existing_infrastructure?: boolean;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { lat: 1.2, log: 3.4, adresse: '...' },
  })
  @IsOptional()
  @IsObject()
  location?: Record<string, any>;

  @ApiPropertyOptional({ type: [String], example: [] })
  @IsOptional()
  @IsArray()
  images?: string[];

  /** Merge/replace contrôlé côté service */
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: {
      ETAT: 'TRES MAUVAIS',
      DIMENSION: { hauteur: 3, largeur: 5 },
    },
  })
  @IsOptional()
  @IsObject()
  attribus?: Record<string, any>;

  @ApiPropertyOptional({ enum: ['merge', 'replace'], default: 'merge' })
  @IsOptional()
  @IsString()
  attribus_mode?: 'merge' | 'replace';

  @ApiPropertyOptional({ type: () => [ComponentInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentInput)
  composant?: ComponentInput[];

  @ApiPropertyOptional({ enum: ['merge', 'replace'], default: 'merge' })
  @IsOptional()
  @IsString()
  composant_mode?: 'merge' | 'replace';
}
