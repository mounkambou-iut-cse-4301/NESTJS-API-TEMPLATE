import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class ComponentInput {
  @ApiProperty({ example: 'PREAU' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: ['SIMPLE', 'COMPLEXE'], example: 'SIMPLE' })
  @IsEnum(['SIMPLE', 'COMPLEXE'])
  type!: 'SIMPLE' | 'COMPLEXE';

  @ApiPropertyOptional({ example: 'Espace couvert' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { lat: 0, log: 0 },
  })
  @IsOptional()
  @IsObject()
  location?: Record<string, any>;

  @ApiPropertyOptional({ type: [String], example: [] })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: {
      ETAT: 'MAUVAIS',
      EXISTENCE_CLOTURE: false,
      MATERIAUX: 'FER',
      DIMENSION: { hauteur: 0, largeur: 1 },
    },
  })
  @IsOptional()
  @IsObject()
  attribus?: Record<string, any>;

  @ApiPropertyOptional({ type: () => [ComponentInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentInput)
  composant?: ComponentInput[];

  /** Pour les updates (ciblage), optionnel en create */
  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  existing_infrastructure?: boolean;
}

export class CreateInfrastructureDto {
  @ApiProperty({ example: 15 })
  @IsInt()
  typeId!: number;

  @ApiProperty({ example: 'ECOLE PRIMAIRE - SITE A' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: ['SIMPLE', 'COMPLEXE'], example: 'COMPLEXE' })
  @IsEnum(['SIMPLE', 'COMPLEXE'])
  type!: 'SIMPLE' | 'COMPLEXE';

  @ApiPropertyOptional({ example: 'Description courte' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 7 })
  @IsInt()
  utilisateurId!: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  regionId!: number;

  @ApiProperty({ example: 12 })
  @IsInt()
  departementId!: number;

  @ApiProperty({ example: 12 })
  @IsInt()
  arrondissementId!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  communeId!: number;

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

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  existing_infrastructure?: boolean;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { lat: 0, log: 0 },
  })
  @IsOptional()
  @IsObject()
  location?: Record<string, any>;

  @ApiPropertyOptional({ type: [String], example: [] })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: {
      ETAT: 'BON',
      NOMBRE_DE_SALLE_: 0,
      SUPERFICIE: 0,
      "NOMBRE_D'ELEVE_PAR_CLASSE": 0,
      DIMENSION: { hauteur: 0, largeur: 1 },
    },
  })
  @IsObject()
  attribus!: Record<string, any>;

  @ApiPropertyOptional({ type: () => [ComponentInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentInput)
  composant?: ComponentInput[];
}
