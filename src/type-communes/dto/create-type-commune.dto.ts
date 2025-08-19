import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateTypeCommuneDto {
  @ApiProperty({ example: 'URBAINE' })
  @IsString() @MinLength(2)
  name!: string;
}
