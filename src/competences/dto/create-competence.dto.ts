import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCompetenceDto {
  @ApiProperty({ example: 'SANTÉ' })
  @IsString() @MinLength(2)
  name!: string;
}
