import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateMaxActiveCommunesDto {
  @ApiProperty({ example: 10, description: 'Plafond global de communes activables' })
  @IsInt()
  @Min(0)
  maxActiveCommunes: number;
}
