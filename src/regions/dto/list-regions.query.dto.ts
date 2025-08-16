import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListRegionsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @Transform(({ value }) => Number(value))
  @IsOptional() @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Transform(({ value }) => Number(value))
  @IsOptional() @IsInt() @Min(1)
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: 'Tri: -created_at,nom' })
  @IsOptional() @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Recherche plein texte (nom, nom_en, code)' })
  @IsOptional() @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filtre exact sur code' })
  @IsOptional() @IsString()
  code?: string;
}
