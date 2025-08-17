// src/user-roles/dto/list-user-roles.query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListUserRolesQueryDto {
  @ApiPropertyOptional({ example: 1 }) @Type(() => Number) @IsInt() @Min(1) @IsOptional() page?: number;
  @ApiPropertyOptional({ example: 20 }) @Type(() => Number) @IsInt() @Min(1) @IsOptional() pageSize?: number;
  @ApiPropertyOptional({ example: 'userId,-roleId' }) @IsOptional() @IsString() sort?: string;

  @ApiPropertyOptional({ example: 10 }) @Type(() => Number) @IsInt() @IsOptional() userId?: number;
  @ApiPropertyOptional({ example: 2 })  @Type(() => Number) @IsInt() @IsOptional() roleId?: number;
}
