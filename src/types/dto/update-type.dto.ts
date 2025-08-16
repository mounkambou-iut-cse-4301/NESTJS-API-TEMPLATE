import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type as T } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { AttributeDto } from './attribute.dto';
import { ComposantDto } from './composant.dto';

export class UpdateTypeDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({ enum: ['SIMPLE','COMPLEXE'] })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsOptional() @IsIn(['SIMPLE','COMPLEXE'])
  type?: string;

  @ApiPropertyOptional() @IsOptional() @IsObject() location?: any;
  @ApiPropertyOptional() @IsOptional() @IsArray()  images?: any[];

  @ApiPropertyOptional({ type: [AttributeDto] })
  @IsOptional() @IsArray()
  @ValidateNested({ each: true })
  @T(() => AttributeDto)
  attribus?: AttributeDto[];

  @ApiPropertyOptional({ type: [ComposantDto] })
  @IsOptional() @IsArray()
  @ValidateNested({ each: true })
  @T(() => ComposantDto)
  composant?: ComposantDto[];

  @ApiPropertyOptional({ description: 'FK Domaine' })
  @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1)
  domaineId?: number;

  @ApiPropertyOptional({ description: 'FK SousDomaine' })
  @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1)
  sousdomaineId?: number;
}
