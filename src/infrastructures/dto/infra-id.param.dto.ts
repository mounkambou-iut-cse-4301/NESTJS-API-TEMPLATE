// src/infrastructures/dto/infra-id.param.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class InfraIdParamDto {
  @ApiProperty({ example: '1', description: 'ID BigInt en string' })
  @Transform(({ value }) => String(value))
  @IsNotEmpty()
  id: string;
}
