// src/permissions/dto/list-permissions.query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListPermissionsQueryDto {
  @ApiPropertyOptional({ example: 1 }) @Type(() => Number) @IsInt() @Min(1) @IsOptional() page?: number;
  @ApiPropertyOptional({ example: 20 }) @Type(() => Number) @IsInt() @Min(1) @IsOptional() pageSize?: number;
  @ApiPropertyOptional({ example: 'code,-id', description: 'tri' }) @IsOptional() @IsString() sort?: string;
  @ApiPropertyOptional({ example: 'INFRA', description: 'recherche sur code' }) @IsOptional() @IsString() q?: string;
}
