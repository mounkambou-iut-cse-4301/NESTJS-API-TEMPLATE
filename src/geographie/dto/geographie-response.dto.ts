import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeographieMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 50 })
  limit: number;

  @ApiProperty({ example: 120 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class RegionBriefDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'NORD' })
  name: string;

  @ApiPropertyOptional({ example: 'NORTH', nullable: true })
  nameEn?: string | null;
}

export class DepartementBriefDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'BENOUE' })
  name: string;

  @ApiPropertyOptional({ example: 'BENUE', nullable: true })
  nameEn?: string | null;

  @ApiProperty({ example: 1 })
  regionId: number;

  @ApiPropertyOptional({ type: RegionBriefDto, nullable: true })
  region?: RegionBriefDto | null;
}

export class RegionResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'NORD' })
  name: string;

  @ApiPropertyOptional({ example: 'NORTH', nullable: true })
  nameEn?: string | null;

  @ApiProperty({ example: 4 })
  totalDepartements: number;

  @ApiProperty({ example: '2026-05-04T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-04T10:00:00.000Z' })
  updatedAt: string;
}

export class DepartementResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'BENOUE' })
  name: string;

  @ApiPropertyOptional({ example: 'BENUE', nullable: true })
  nameEn?: string | null;

  @ApiProperty({ example: 1 })
  regionId: number;

  @ApiProperty({ type: RegionBriefDto })
  region: RegionBriefDto;

  @ApiProperty({ example: 11 })
  totalArrondissements: number;

  @ApiProperty({ example: '2026-05-04T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-04T10:00:00.000Z' })
  updatedAt: string;
}

export class ArrodissementResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'GAROUA 1ER' })
  name: string;

  @ApiPropertyOptional({ example: 'GAROUA 1ST', nullable: true })
  nameEn?: string | null;

  @ApiProperty({ example: 1 })
  departementId: number;

  @ApiProperty({ type: DepartementBriefDto })
  departement: DepartementBriefDto;

  @ApiProperty({ example: '2026-05-04T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-04T10:00:00.000Z' })
  updatedAt: string;
}

export class RegionsListResponseDto {
  @ApiProperty({ example: 'Liste des régions récupérée avec succès.' })
  message: string;

  @ApiProperty({ example: 'Regions fetched successfully.' })
  messageE: string;

  @ApiProperty({ type: [RegionResponseDto] })
  data: RegionResponseDto[];

  @ApiProperty({ type: GeographieMetaDto })
  meta: GeographieMetaDto;
}

export class DepartementsListResponseDto {
  @ApiProperty({ example: 'Liste des départements récupérée avec succès.' })
  message: string;

  @ApiProperty({ example: 'Divisions fetched successfully.' })
  messageE: string;

  @ApiProperty({ type: [DepartementResponseDto] })
  data: DepartementResponseDto[];

  @ApiProperty({ type: GeographieMetaDto })
  meta: GeographieMetaDto;
}

export class ArrondissementsListResponseDto {
  @ApiProperty({ example: 'Liste des arrondissements récupérée avec succès.' })
  message: string;

  @ApiProperty({ example: 'Subdivisions fetched successfully.' })
  messageE: string;

  @ApiProperty({ type: [ArrodissementResponseDto] })
  data: ArrodissementResponseDto[];

  @ApiProperty({ type: GeographieMetaDto })
  meta: GeographieMetaDto;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 'Paramètres invalides.' })
  message: string;

  @ApiProperty({ example: 'Invalid parameters.' })
  messageE: string;
}