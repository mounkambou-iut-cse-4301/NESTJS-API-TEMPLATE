// import { ApiPropertyOptional } from '@nestjs/swagger';
// import { Transform } from 'class-transformer';
// import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

// function toUpper(input: any) {
//   return typeof input === 'string' ? input.toUpperCase() : input;
// }

// export class ListTypesQueryDto {
//   @ApiPropertyOptional({ example: 1, minimum: 1 })
//   @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
//   @IsOptional()
//   @IsInt()
//   @Min(1)
//   page?: number;

//   @ApiPropertyOptional({ example: 20, minimum: 1 })
//   @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
//   @IsOptional()
//   @IsInt()
//   @Min(1)
//   pageSize?: number;

//   @ApiPropertyOptional({
//     description: 'Tri, ex: "id,-name" (id ASC, name DESC).',
//     example: 'id,-name',
//   })
//   @IsOptional()
//   @IsString()
//   sort?: string;

//   @ApiPropertyOptional({ description: 'Recherche plein texte (name/description).' })
//   @IsOptional()
//   @IsString()
//   q?: string;

//   @ApiPropertyOptional({ enum: ['SIMPLE', 'COMPLEXE'] })
//   @Transform(({ value }) => toUpper(value))
//   @IsOptional()
//   @IsIn(['SIMPLE', 'COMPLEXE'])
//   type?: 'SIMPLE' | 'COMPLEXE';

//   @ApiPropertyOptional({ example: 1 })
//   @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
//   @IsOptional()
//   @IsInt()
//   @Min(1)
//   domaineId?: number;

//   @ApiPropertyOptional({ example: 3 })
//   @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
//   @IsOptional()
//   @IsInt()
//   @Min(1)
//   sousdomaineId?: number;

//   @ApiPropertyOptional({ example: 5 })
//   @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
//   @IsOptional()
//   @IsInt()
//   @Min(1)
//   competenceId?: number;
// }
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

function toUpper(input: any) {
  return typeof input === 'string' ? input.toUpperCase() : input;
}

export class ListTypesQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1 })
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'Tri, ex: "id,-name" (id ASC, name DESC).',
    example: 'id,-name',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Recherche plein texte (name/description).' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ['SIMPLE', 'COMPLEXE'] })
  @Transform(({ value }) => toUpper(value))
  @IsOptional()
  @IsIn(['SIMPLE', 'COMPLEXE'])
  type?: 'SIMPLE' | 'COMPLEXE';

  @ApiPropertyOptional({ example: 1 })
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(1)
  domaineId?: number;

  @ApiPropertyOptional({ example: 3 })
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(1)
  sousdomaineId?: number;

  @ApiPropertyOptional({ example: 5 })
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(1)
  competenceId?: number;
}
