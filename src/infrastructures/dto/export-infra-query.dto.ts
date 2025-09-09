// src/infrastructures/dto/export-infra-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsArray, IsString, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Enum lisible par Swagger
export enum ExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
  PDF = 'pdf',
}

export class ExportInfraQueryDto {
  @ApiPropertyOptional({
    description: 'Format de sortie du fichier',
    enum: ExportFormat,
    default: ExportFormat.XLSX,
  })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.XLSX;

  @ApiPropertyOptional({
    description: 'Colonnes à inclure. Utiliser ?columns=col1,col2 OU columns=col1&columns=col2',
    type: String,
    isArray: true,
    example: ['id', 'name', 'regionId'],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    // Accepte "col1,col2" ou ["col1","col2"]
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  })
  columns?: string[];

  @ApiPropertyOptional({ description: 'Recherche texte (contient)', example: 'hopital' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Date min (ISO 8601)', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date max (ISO 8601)', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filtre par région', example: 1 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  regionId?: number;

  @ApiPropertyOptional({ description: 'Filtre par département', example: 2 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  departementId?: number;

  @ApiPropertyOptional({ description: 'Filtre par commune', example: 3 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  communeId?: number;

  @ApiPropertyOptional({ description: 'Filtre par type infrastructure', example: 10 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  id_type_infrastructure?: number;
}
