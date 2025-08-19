import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListParcoursQueryDto {
  @ApiPropertyOptional({ description: 'Page (défaut 1)', example: 1 })
  @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Taille de page (1..100, défaut 20)', example: 20 })
  @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @IsOptional()
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: 'Tri: "recordedAt,-id"…', example: 'recordedAt,-id' })
  @IsString() @IsOptional()
  sort?: string;

  @ApiPropertyOptional({ description: 'Filtre par collecterId (par défaut: si user connecté, on restreint à son id)' })
  @Transform(({ value }) => Number(value)) @IsInt() @IsOptional()
  collecteurId?: number;

  @ApiPropertyOptional({ description: 'De (YYYY-MM-DD) sur recordedAt' })
  @IsString() @IsOptional()
  from?: string;

  @ApiPropertyOptional({ description: 'À (YYYY-MM-DD) sur recordedAt' })
  @IsString() @IsOptional()
  to?: string;
}
