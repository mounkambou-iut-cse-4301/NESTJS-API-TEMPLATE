import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRegionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nom_en?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;
}
