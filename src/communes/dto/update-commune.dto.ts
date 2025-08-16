import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateCommuneDto {
  @ApiPropertyOptional() @IsOptional() @IsString() nom?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nom_en?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiPropertyOptional({ description: 'FK Arrondissement.id' }) @IsOptional() @IsInt() arrondissementId?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_verified?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_block?: boolean;
}
