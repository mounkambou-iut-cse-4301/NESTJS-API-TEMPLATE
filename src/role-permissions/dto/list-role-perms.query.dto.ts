// src/role-permissions/dto/list-role-perms.query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListRolePermsQueryDto {
  @ApiPropertyOptional({ example: 1 }) @Type(() => Number) @IsInt() @Min(1) @IsOptional() page?: number;
  @ApiPropertyOptional({ example: 20 }) @Type(() => Number) @IsInt() @Min(1) @IsOptional() pageSize?: number;
  @ApiPropertyOptional({ example: 'roleId,-permissionId' }) @IsOptional() @IsString() sort?: string;

  @ApiPropertyOptional({ example: 2 })  @Type(() => Number) @IsInt() @IsOptional() roleId?: number;
  @ApiPropertyOptional({ example: 5 })  @Type(() => Number) @IsInt() @IsOptional() permissionId?: number;
  @ApiPropertyOptional({ example: 'INFRA_', description: 'recherche sur code permission' }) @IsOptional() @IsString() q?: string;
}
