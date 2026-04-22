import { ApiProperty } from '@nestjs/swagger';
import { TypeCommission } from '@prisma/client';

export class ErrorResponseDto {
  @ApiProperty({ example: 'Paramètres introuvables.' })
  message: string;

  @ApiProperty({ example: 'Settings not found.' })
  messageE: string;
}

export class SettingDataDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 10 })
  commission_domicile: number;

  @ApiProperty({
    enum: TypeCommission,
    example: TypeCommission.POURCENTAGE,
  })
  commission_domicile_type: TypeCommission;

  @ApiProperty({ example: 15 })
  commission_institut: number;

  @ApiProperty({
    enum: TypeCommission,
    example: TypeCommission.POURCENTAGE,
  })
  commission_institut_type: TypeCommission;

  @ApiProperty({ example: '2026-04-21T10:00:00.000Z' })
  created_at: string;

  @ApiProperty({ example: '2026-04-21T11:00:00.000Z' })
  updated_at: string;
}

export class SettingResponseDto {
  @ApiProperty({ example: 'Paramètres récupérés.' })
  message: string;

  @ApiProperty({ example: 'Settings fetched.' })
  messageE: string;

  @ApiProperty({ type: () => SettingDataDto })
  data: SettingDataDto;
}