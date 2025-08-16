import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ArrondissementIdParamDto {
  @ApiProperty({ example: 100 })
  @Transform(({ value }) => Number(value))
  @IsInt() @Min(1)
  id: number;
}
