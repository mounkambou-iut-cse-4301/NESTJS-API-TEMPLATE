import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateDepartementDto {
  @ApiProperty({ example: 'Mfoundi' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({ example: 'Mfoundi' })
  @IsOptional() @IsString()
  nom_en?: string;

  @ApiPropertyOptional({ example: 'MF' })
  @IsOptional() @IsString()
  code?: string;

  @ApiProperty({ example: 1, description: 'FK Region.id' })
  @IsInt()
  regionId: number;
}
