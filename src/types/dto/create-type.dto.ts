import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type as T } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { AttributeDto } from './attribute.dto';
import { ComposantDto } from './composant.dto';

export class CreateTypeDto {
  @ApiProperty({ example: 'hopital_district' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Hôpital de district…' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'COMPLEXE', enum: ['SIMPLE','COMPLEXE'] })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsIn(['SIMPLE','COMPLEXE'])
  type: string;

  @ApiProperty({ example: { lat: 0, log: 0 } })
  @IsObject()
  location: any;

  @ApiProperty({ example: [] })
  @IsArray()
  images: any[];

  @ApiProperty({ type: [AttributeDto], description: 'Toujours un tableau d’objets' })
  @IsArray()
  @ValidateNested({ each: true })
  @T(() => AttributeDto)
  attribus: AttributeDto[];

  @ApiPropertyOptional({ type: [ComposantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @T(() => ComposantDto)
  composant?: ComposantDto[];

  @ApiPropertyOptional({ description: 'FK Domaine', example: 1 })
  @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  domaineId?: number;

  @ApiPropertyOptional({ description: 'FK SousDomaine', example: 2 })
  @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  sousdomaineId?: number;
}
