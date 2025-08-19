import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListInfraQueryDto {
  @ApiPropertyOptional({ default: 1 })  @Transform(({ value }) => Number(value))
  @IsOptional() @IsInt() @Min(1) page?: number = 1;

  @ApiPropertyOptional({ default: 20 }) @Transform(({ value }) => Number(value))
  @IsOptional() @IsInt() @Min(1) pageSize?: number = 20;

  @ApiPropertyOptional({ description: 'Tri: -created_at,name,type' })
  @IsOptional() @IsString() sort?: string;

  @ApiPropertyOptional() @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1) regionId?: number;

  @ApiPropertyOptional() @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1) departementId?: number;

  @ApiPropertyOptional() @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1) arrondissementId?: number;

  @ApiPropertyOptional() @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1) communeId?: number;

  @ApiPropertyOptional({ description: 'id_type_infrastructure' })
  @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1) typeId?: number;

  @ApiPropertyOptional({ description: 'SIMPLE|COMPLEXE' })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsOptional() @IsIn(['SIMPLE','COMPLEXE']) type?: string;

  @ApiPropertyOptional({ description: 'Recherche dans name et description' })
  @IsOptional() @IsString() q?: string;

  @ApiPropertyOptional({ description: 'Filtre domaineId' })
  @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1) domaineId?: number;
    
  @ApiPropertyOptional({ description: 'Filtre utilisateurId' })
  @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1) utilisateurId?: number;

   @ApiPropertyOptional({ description: 'Filtre competenceId' })
  @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1) competenceId?: number;

  @ApiPropertyOptional({ description: 'Filtre sousdomaineId' })
  @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1) sousdomaineId?: number;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD' }) @IsOptional() @IsString()
  created_from?: string;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD' }) @IsOptional() @IsString()
  created_to?: string;
}
