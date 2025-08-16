import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBooleanString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListCommunesQueryDto {
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

  @ApiPropertyOptional({ description: 'Filtre par Arrondissement.id' })
  @Transform(({ value }) => Number(value))
  @IsOptional() @IsInt()
  arrondissementId?: number;

  @ApiPropertyOptional({ description: 'Filtre exact sur code' })
  @IsOptional() @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Filtre is_verified' })
  @IsOptional() @IsBooleanString()
  is_verified?: string;

  @ApiPropertyOptional({ description: 'Filtre is_block' })
  @IsOptional() @IsBooleanString()
  is_block?: string;
}
