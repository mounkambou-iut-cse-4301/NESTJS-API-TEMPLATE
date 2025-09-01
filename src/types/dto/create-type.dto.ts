// src/types/dto/create-type.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { AttributeDto } from './attribute.dto';

function toUpper(input: any) { return typeof input === 'string' ? input.toUpperCase() : input; }
function upperNoAccents(input: string): string {
  return (input ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}
/** [1,"2",{id:3}] → [1,2,3] */
function toIdArray(input: any): number[] {
  const arr = Array.isArray(input) ? input : input == null ? [] : [input];
  const ids = arr.map((it) => {
    if (typeof it === 'number') return it;
    if (typeof it === 'string' && it.trim() !== '' && !Number.isNaN(Number(it))) return Number(it);
    if (it && typeof it === 'object' && typeof (it as any).id !== 'undefined') {
      const v = (it as any).id;
      if (typeof v === 'number') return v;
      if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
    }
    return null;
  }).filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  return Array.from(new Set(ids));
}

export class CreateTypeDto {
  @ApiProperty({ example: 'HOPITAL_DISTRICT' })
  @Transform(({ value }) => upperNoAccents(value))
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Hôpital de district…' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'COMPLEXE', enum: ['SIMPLE','COMPLEXE'] })
  @Transform(({ value }) => toUpper(value))
  @IsIn(['SIMPLE','COMPLEXE'])
  type: 'SIMPLE'|'COMPLEXE';

  @ApiProperty({ example: { lat: 0, log: 0 } })
  @IsObject()
  location: any;

  @ApiProperty({ example: [] })
  @IsArray()
  images: any[];

  @ApiProperty({
    type: [AttributeDto],
    description: 'Attributs; supporte type=object (value = tableau d’AttributeDto récursif).',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  attribus: AttributeDto[];

  @ApiPropertyOptional({ description: 'IDs des types composants.', type: [Number], example: [2,5,9] })
  @Transform(({ value }) => toIdArray(value))
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  composant?: number[];

  @ApiPropertyOptional({ example: 1 }) @Transform(({ value }) => value === undefined ? undefined : Number(value)) @IsOptional() @IsInt() @Min(1)
  domaineId?: number;

  @ApiPropertyOptional({ example: 1 }) @Transform(({ value }) => value === undefined ? undefined : Number(value)) @IsOptional() @IsInt() @Min(1)
  competenceId?: number;

  @ApiPropertyOptional({ example: 2 }) @Transform(({ value }) => value === undefined ? undefined : Number(value)) @IsOptional() @IsInt() @Min(1)
  sousdomaineId?: number;
}
