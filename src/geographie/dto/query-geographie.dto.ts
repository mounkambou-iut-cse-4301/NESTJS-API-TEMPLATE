import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

function trimValue({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

export class BaseGeographieQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Numéro de la page. Valeur par défaut : 1.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La page doit être un entier.' })
  @Min(1, { message: 'La page doit être supérieure ou égale à 1.' })
  page?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Nombre d’éléments par page. Valeur par défaut : 50, maximum : 200.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La limite doit être un entier.' })
  @Min(1, { message: 'La limite doit être supérieure ou égale à 1.' })
  @Max(200, { message: 'La limite maximale autorisée est 200.' })
  limit?: number;
}

export class GetRegionsQueryDto extends BaseGeographieQueryDto {
  @ApiPropertyOptional({
    example: 'NORD',
    description: 'Filtre par nom français ou anglais de la région.',
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
  @Transform(trimValue)
  name?: string;
}

export class GetDepartementsQueryDto extends BaseGeographieQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Filtre les départements par ID de région.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'regionId doit être un entier.' })
  @Min(1, { message: 'regionId doit être supérieur ou égal à 1.' })
  regionId?: number;

  @ApiPropertyOptional({
    example: 'BENOUE',
    description: 'Filtre par nom français ou anglais du département.',
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
  @Transform(trimValue)
  name?: string;
}

export class GetArrondissementsQueryDto extends BaseGeographieQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Filtre les arrondissements par ID de région.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'regionId doit être un entier.' })
  @Min(1, { message: 'regionId doit être supérieur ou égal à 1.' })
  regionId?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Filtre les arrondissements par ID de département.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'departementId doit être un entier.' })
  @Min(1, { message: 'departementId doit être supérieur ou égal à 1.' })
  departementId?: number;

  @ApiPropertyOptional({
    example: 'GAROUA',
    description: 'Filtre par nom français ou anglais de l’arrondissement.',
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
  @Transform(trimValue)
  name?: string;
}