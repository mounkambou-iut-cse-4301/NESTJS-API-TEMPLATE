// src/types/dto/attribute.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

function upperNoAccents(input: string): string {
  return (input ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, '_')
    .trim();
}
function toLower(input: any) {
  return typeof input === 'string' ? input.trim().toLowerCase() : input;
}

export class AttributeDto {
  @ApiProperty({ description: 'Clé attribut (normalisée en MAJ SANS ACCENT).' })
  @Transform(({ value }) => upperNoAccents(String(value)))
  @IsString()
  key: string;

  @ApiPropertyOptional({
    description: 'Type (toujours en minuscule). Alias "enm" accepté pour "enum".',
    enum: ['string','number','boolean','enum','enm','object'],
    example: 'object'
  })
  @Transform(({ value }) => toLower(value))
  @IsOptional()
  @IsIn(['string','number','boolean','enum','enm','object'])
  type?: 'string'|'number'|'boolean'|'enum'|'enm'|'object';

  @ApiPropertyOptional({
    description: 'Valeur. Pour "object": tableau d’attributs (récursif). Pour "enum": CSV ou array de string.',
    oneOf: [
      { type: 'string' },
      { type: 'number' },
      { type: 'boolean' },
      { type: 'array', items: { type: 'string' } },
      { type: 'array', items: { $ref: '#/components/schemas/AttributeDto' } },
      { type: 'null' }
    ],
    examples: [
      'A, B, C',
      ['A','B'],
      12,
      true,
      null,
      [
        { "key":"HAUTEUR","type":"number","value":0 },
        { "key":"LARGEUR","type":"number","value":0 }
      ]
    ]
  })
  @IsOptional()
  value?: any;
}
