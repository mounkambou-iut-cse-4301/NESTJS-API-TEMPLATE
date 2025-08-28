import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

function upperNoAccents(input: string): string {
  return (input ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim();
}

function toLower(input: any) {
  return typeof input === 'string' ? input.trim().toLowerCase() : input;
}

export class AttributeDto {
  @ApiProperty({ description: 'Clé de l’attribut (sera normalisée en MAJ SANS ACCENT).' })
  @Transform(({ value }) => upperNoAccents(String(value)))
  @IsString()
  key: string;

  @ApiPropertyOptional({
    description: 'Type de la valeur (string | number | boolean | enum). "enm" accepté comme alias de "enum".',
    enum: ['string', 'number', 'boolean', 'enum', 'enm'],
    example: 'enum',
  })
  @Transform(({ value }) => toLower(value))
  @IsOptional()
  @IsIn(['string', 'number', 'boolean', 'enum', 'enm'])
  type?: 'string' | 'number' | 'boolean' | 'enum' | 'enm';

  @ApiPropertyOptional({
    description: 'Valeur. Pour enum: string CSV OU array de string. Pour number/boolean/string: valeur simple.',
    oneOf: [
      { type: 'string' },
      { type: 'number' },
      { type: 'boolean' },
      { type: 'array', items: { type: 'string' } },
      { type: 'null' },
    ],
    examples: ['A, B, C', ['A', 'B'], 12, true, null],
  })
  @IsOptional()
  value?: any;
}