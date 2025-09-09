// src/infrastructures/dto/bulk.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { CreateInfrastructureDto } from './create-infra.dto';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkInfraDto {
  @ApiProperty({ type: [CreateInfrastructureDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInfrastructureDto)
  items: CreateInfrastructureDto[];
}
