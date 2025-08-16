import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSousDomaineDto {
  @ApiProperty({ example: 1, description: 'FK Domaine' })
  @Transform(({ value }) => Number(value))
  @IsInt() @Min(1)
  domaineId: number;

  @ApiProperty({ example: 'maternité' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({ example: 'maternity' })
  @IsOptional() @IsString()
  nom_en?: string;

  @ApiPropertyOptional({ example: 'MAT' })
  @IsOptional() @IsString()
  code?: string;
}
