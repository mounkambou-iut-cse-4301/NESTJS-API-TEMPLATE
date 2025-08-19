import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class ParcourItemDto {
  @ApiProperty({ description: 'Latitude', example: 3.8613 })
  @IsNumber() @Min(-90) @Max(90)
  latitude!: number;

  @ApiProperty({ description: 'Longitude', example: 11.5021 })
  @IsNumber() @Min(-180) @Max(180)
  longitude!: number;

  @ApiPropertyOptional({ description: 'Horodatage de la mesure (ISO). Défaut: maintenant' })
  @IsDateString() @IsOptional()
  recordedAt?: string;

  @ApiPropertyOptional({ description: 'FK utilisateur collecteur. Défaut: req.user.id si connecté' })
  @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @IsOptional()
  collecteurId?: number;
}
