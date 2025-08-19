import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateCommuneDto {
  @ApiPropertyOptional() @IsOptional() @IsString() nom?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nom_en?: string;
      @ApiPropertyOptional({ example: 'Mr Emmanuel' })
  @IsOptional() @IsString()
  nom_maire?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() longitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiPropertyOptional({ description: 'FK Arrondissement.id' }) @IsOptional() @IsInt() arrondissementId?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_verified?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_block?: boolean;
  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @IsInt()
  typeCommuneId?: number;
}
