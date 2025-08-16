import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateDomaineDto {
  @ApiProperty({ example: 'santé' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({ example: 'health' })
  @IsOptional() @IsString()
  nom_en?: string;

  @ApiPropertyOptional({ example: 'HLTH' })
  @IsOptional() @IsString()
  code?: string;
}
