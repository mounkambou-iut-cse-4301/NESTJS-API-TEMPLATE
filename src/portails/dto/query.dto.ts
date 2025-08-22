// src/portails/dto/query.dto.ts
import { IsInt, IsOptional, IsIn, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PageQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number;

  @ApiPropertyOptional({ example: 'pont' })
  @IsOptional()
  @IsString()
  q?: string;
}

export class InfraListQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  typeId?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  communeId?: number;
}

export class ExportQueryDto {
  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  typeId?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  communeId?: number;

  @ApiPropertyOptional({ example: 'csv', enum: ['csv', 'xlsx', 'pdf'] })
  @IsOptional()
  @IsIn(['csv', 'xlsx', 'pdf'])
  format?: 'csv' | 'xlsx' | 'pdf';
}

export class SummaryQueryDto {
  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  communeId?: number;
}

export class TypesBreakdownQueryDto {
  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  communeId?: number;
}
