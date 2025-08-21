import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class TypeStatsGeoQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Filtre optionnel' })
  @IsOptional() @IsInt()
  regionId?: number;

  @ApiPropertyOptional({ example: 12, description: 'Filtre optionnel' })
  @IsOptional() @IsInt()
  departementId?: number;

  @ApiPropertyOptional({ example: 123, description: 'Filtre optionnel' })
  @IsOptional() @IsInt()
  arrondissementId?: number;
}
