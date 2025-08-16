import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UserIdParamDto {
  @ApiProperty({ example: 12 })
  @Transform(({ value }) => Number(value))
  @IsInt() @Min(1)
  id: number;
}
