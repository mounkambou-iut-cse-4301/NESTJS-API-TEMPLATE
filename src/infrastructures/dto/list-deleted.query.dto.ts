import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListDeletedQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsOptional() @IsInt() @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1 })
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsOptional() @IsInt() @Min(1)
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'Tri, ex: "id,-name" (id ASC, name DESC).',
    example: 'id,-created_at'
  })
  @IsOptional() @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Recherche plein texte (name/description/reason).' })
  @IsOptional() @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ['SIMPLE','COMPLEXE'] })
  @Transform(({ value }) => typeof value === 'string' ? value.toUpperCase() : value)
  @IsOptional() @IsIn(['SIMPLE','COMPLEXE'])
  type?: 'SIMPLE'|'COMPLEXE';

  @ApiPropertyOptional({ example: 2 })  @Transform(({ value }) => value === undefined ? undefined : Number(value)) @IsOptional() @IsInt() @Min(1) regionId?: number;
  @ApiPropertyOptional({ example: 12 }) @Transform(({ value }) => value === undefined ? undefined : Number(value)) @IsOptional() @IsInt() @Min(1) departementId?: number;
  @ApiPropertyOptional({ example: 12 }) @Transform(({ value }) => value === undefined ? undefined : Number(value)) @IsOptional() @IsInt() @Min(1) arrondissementId?: number;
  @ApiPropertyOptional({ example: 1 })  @Transform(({ value }) => value === undefined ? undefined : Number(value)) @IsOptional() @IsInt() @Min(1) communeId?: number;
  @ApiPropertyOptional({ example: 15 }) @Transform(({ value }) => value === undefined ? undefined : Number(value)) @IsOptional() @IsInt() @Min(1) typeId?: number;
  @ApiPropertyOptional({ example: 2 })  @Transform(({ value }) => value === undefined ? undefined : Number(value)) @IsOptional() @IsInt() @Min(1) domaineId?: number;
  @ApiPropertyOptional({ example: 21 }) @Transform(({ value }) => value === undefined ? undefined : Number(value)) @IsOptional() @IsInt() @Min(1) sousdomaineId?: number;
  @ApiPropertyOptional({ example: 2 })  @Transform(({ value }) => value === undefined ? undefined : Number(value)) @IsOptional() @IsInt() @Min(1) competenceId?: number;
  @ApiPropertyOptional({ example: 7 })  @Transform(({ value }) => value === undefined ? undefined : Number(value)) @IsOptional() @IsInt() @Min(1) utilisateurId?: number;
}
