// src/roles/dto/list-roles.query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListRolesQueryDto {
  @ApiPropertyOptional({ example: 1 }) @Type(() => Number) @IsInt() @Min(1) @IsOptional() page?: number;
  @ApiPropertyOptional({ example: 20 }) @Type(() => Number) @IsInt() @Min(1) @IsOptional() pageSize?: number;
  @ApiPropertyOptional({ example: 'nom,-id', description: 'tri, ex: "nom,-id"' })
  @IsOptional() @IsString() sort?: string;
  @ApiPropertyOptional({ example: 'COMMUNE', description: 'recherche plein texte sur nom' })
  @IsOptional() @IsString() q?: string;
  @ApiPropertyOptional({ example: 'INFRA_ECRIRE', description: 'filtrer par code permission associé' })
  @IsOptional() @IsString() permissionCode?: string;
}
