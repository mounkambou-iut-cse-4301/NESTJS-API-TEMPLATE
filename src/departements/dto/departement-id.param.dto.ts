import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class DepartementIdParamDto {
  @ApiProperty({ example: 10 })
  @Transform(({ value }) => Number(value))
  @IsInt() @Min(1)
  id: number;
}
