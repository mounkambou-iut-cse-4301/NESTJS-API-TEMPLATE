import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class LastMonthsQueryDto {
  @ApiPropertyOptional({ description: 'Nombre de mois à remonter (1–24)', default: 12 })
  @Transform(({ value }) => value === undefined ? 12 : Number(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  months?: number = 12;
}
