import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateRegionDto {
  @ApiProperty({ example: 'Centre' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({ example: 'Center' })
  @IsOptional()
  @IsString()
  nom_en?: string;

  @ApiPropertyOptional({ example: 'CE' })
  @IsOptional()
  @IsString()
  code?: string;
}
