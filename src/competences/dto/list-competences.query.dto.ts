import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListCompetencesQueryDto {
  @ApiPropertyOptional() @IsString() @IsOptional()
  q?: string;

  @ApiPropertyOptional({ example: 1 })
  @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @IsOptional()
  pageSize?: number = 20;

  @ApiPropertyOptional({ example: 'name,-id' })
  @IsString() @IsOptional()
  sort?: string;
}
