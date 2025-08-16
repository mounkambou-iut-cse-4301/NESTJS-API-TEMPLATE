import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBooleanString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListUsersQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @Transform(({ value }) => Number(value))
  @IsOptional() @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Transform(({ value }) => Number(value))
  @IsOptional() @IsInt() @Min(1)
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: 'Tri: -created_at,name' })
  @IsOptional() @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Recherche (nom, email)' })
  @IsOptional() @IsString()
  q?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => Number(value))
  @IsOptional() @IsInt()
  communeId?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsBooleanString()
  is_verified?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsBooleanString()
  is_block?: string;
}
