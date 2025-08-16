import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCommuneDto {
  @ApiProperty({ example: 'Commune de Yaoundé I' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({ example: 'Yaounde I Council' })
  @IsOptional() @IsString()
  nom_en?: string;

  @ApiPropertyOptional({ example: 'YDE1C' })
  @IsOptional() @IsString()
  code?: string;

  @ApiProperty({ example: 100, description: 'FK Arrondissement.id' })
  @IsInt()
  arrondissementId: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  is_verified?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  is_block?: boolean;
}
