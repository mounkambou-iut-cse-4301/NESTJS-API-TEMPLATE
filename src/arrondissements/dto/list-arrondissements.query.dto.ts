import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListArrondissementsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @Transform(({ value }) => Number(value))
  @IsOptional() @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Transform(({ value }) => Number(value))
  @IsOptional() @IsInt() @Min(1)
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: 'Tri: -id,nom,code' })
  @IsOptional() @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Recherche (nom, nom_en, code)' })
  @IsOptional() @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filtre par Departement.id' })
  @Transform(({ value }) => Number(value))
  @IsOptional() @IsInt()
  departementId?: number;

  @ApiPropertyOptional({ description: 'Filtre exact sur code' })
  @IsOptional() @IsString()
  code?: string;
}
