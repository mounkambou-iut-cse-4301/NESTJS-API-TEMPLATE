import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, IsNumber, IsLatitude, IsLongitude } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommuneDto {
  @ApiProperty({ example: 'Commune de Yaoundé I' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({ example: 'Yaounde I Council' })
  @IsOptional() @IsString()
  nom_en?: string;

  @ApiPropertyOptional({ example: 'Mr Emmanuel' })
  @IsOptional() @IsString()
  nom_maire?: string;

  // Yaoundé ~ lon: 11.50, lat: 3.85 (tes exemples étaient inversés)
  @ApiPropertyOptional({ example: 11.5021, type: Number, format: 'float' })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  // ou: @IsNumber({ maxDecimalPlaces: 8 })
  longitude?: number;

  @ApiPropertyOptional({ example: 3.8481, type: Number, format: 'float' })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  // ou: @IsNumber({ maxDecimalPlaces: 8 })
  latitude?: number;

  @ApiPropertyOptional({ example: 'YDE1C' })
  @IsOptional() @IsString()
  code?: string;

  @ApiProperty({ example: 100, description: 'FK Arrondissement.id' })
  @IsOptional()
  @IsInt()
  arrondissementId: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @IsInt()
  typeCommuneId?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  @Type(() => Boolean)
  is_verified?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  @Type(() => Boolean)
  is_block?: boolean;
}
