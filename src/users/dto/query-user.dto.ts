import { ApiPropertyOptional } from '@nestjs/swagger';
import { TypeUtilisateur } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

function trimValue({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

function toBoolean({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return value;
}

export class QueryUserDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Numéro de page. Par défaut : 1.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Nombre d’éléments par page. Par défaut : 10, maximum : 100.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    example: 'agent',
    description: 'Recherche globale sur nom, email, téléphone et type.',
  })
  @IsOptional()
  @IsString()
  @Transform(trimValue)
  search?: string;

  @ApiPropertyOptional({ example: 'Agent Collecte Un' })
  @IsOptional()
  @IsString()
  @Transform(trimValue)
  name?: string;

  @ApiPropertyOptional({ example: 'agent1@collect-femme.com' })
  @IsOptional()
  @IsString()
  @Transform(trimValue)
  email?: string;

  @ApiPropertyOptional({ example: '+237690000001' })
  @IsOptional()
  @IsString()
  @Transform(trimValue)
  phone?: string;

  @ApiPropertyOptional({
    enum: TypeUtilisateur,
    example: TypeUtilisateur.INSPECTEUR,
    description: 'Filtre par type métier : SUPERADMIN, ADMIN, INSPECTEUR.',
  })
  @IsOptional()
  @IsEnum(TypeUtilisateur)
  type?: TypeUtilisateur;

  @ApiPropertyOptional({
    example: 1,
    description: 'Filtre par région.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  regionId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Filtre par département.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departementId?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Filtre les comptes bloqués ou non.',
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isBlock?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Filtre les comptes vérifiés ou non.',
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Filtre les comptes supprimés logiquement ou non.',
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isDeleted?: boolean;

  @ApiPropertyOptional({
    example: '2026-05-01',
    description: 'Date de création minimale.',
  })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({
    example: '2026-05-31',
    description: 'Date de création maximale.',
  })
  @IsOptional()
  @IsDateString()
  createdTo?: string;
}