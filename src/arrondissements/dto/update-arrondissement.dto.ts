import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateArrondissementDto {
  @ApiPropertyOptional() @IsOptional() @IsString() nom?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nom_en?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiPropertyOptional({ description: 'FK Departement.id' }) @IsOptional() @IsInt() departementId?: number;
}
