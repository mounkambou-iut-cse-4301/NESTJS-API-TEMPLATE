import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';

export class UpdateCommuneDto {
  @ApiPropertyOptional() @IsOptional() @IsString() nom?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nom_en?: string;
    @ApiPropertyOptional({ example: 'https://ma-commune.cm' })
@IsOptional()
@IsString() // ou @IsUrl()
communeUrl?: string | null;

      @ApiPropertyOptional({ example: 'Mr Emmanuel' })
  @IsOptional() @IsString()
  nom_maire?: string;
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
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiPropertyOptional({ description: 'FK Arrondissement.id' }) @IsOptional() @IsInt() arrondissementId?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_verified?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_block?: boolean;
  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @IsInt()
  typeCommuneId?: number;
}
