import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsUrl, ValidateIf } from 'class-validator';

export class UpdateSettingDto {
  @ApiPropertyOptional({ description: 'URL du serveur central (nullable)', example: 'https://central.example.com' })
  @Transform(({ value }) =>
    value === undefined
      ? undefined
      : (value === null || String(value).trim() === '' ? null : String(value).trim())
  )
  @IsOptional()
  @ValidateIf((o) => o.centralServerUrl !== null)
  @IsUrl({ require_protocol: true }, { message: 'URL invalide' })
  centralServerUrl?: string | null;
}
