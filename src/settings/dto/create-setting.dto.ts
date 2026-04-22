import { ApiPropertyOptional } from '@nestjs/swagger';
import { TypeCommission } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSettingDto {
  @ApiPropertyOptional({
    description: 'Commission à domicile',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  commission_domicile?: number;

  @ApiPropertyOptional({
    description: 'Type de commission à domicile',
    enum: TypeCommission,
    example: TypeCommission.POURCENTAGE,
  })
  @IsOptional()
  @IsEnum(TypeCommission)
  commission_domicile_type?: TypeCommission;

  @ApiPropertyOptional({
    description: 'Commission institut',
    example: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  commission_institut?: number;

  @ApiPropertyOptional({
    description: 'Type de commission institut',
    enum: TypeCommission,
    example: TypeCommission.POURCENTAGE,
  })
  @IsOptional()
  @IsEnum(TypeCommission)
  commission_institut_type?: TypeCommission;
}