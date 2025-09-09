// // src/types/dto/composant.dto.ts
// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// import { Type } from 'class-transformer';
// import { IsArray, IsIn, IsObject, IsOptional, IsString } from 'class-validator';
// import { AttributeDto } from './attribute.dto';

// export class ComposantDto {
//   @ApiPropertyOptional({ example: 1 })
//   @IsOptional()
//   id?: number;

//   @ApiProperty({ example: 'Pharmacie' })
//   @IsString()
//   name: string;

//   @ApiPropertyOptional({ example: 'Dépôt et dispensation internes' })
//   @IsOptional()
//   @IsString()
//   description?: string;

//   @ApiProperty({ example: 'SIMPLE', enum: ['SIMPLE','COMPLEXE'] })
//   @IsIn(['SIMPLE','COMPLEXE'])
//   type: string;

//   @ApiProperty({ example: { lat: 0, log: 0 } })
//   @IsObject()
//   location: any;

//   @ApiProperty({ example: [] })
//   @IsArray()
//   images: any[];

//   @ApiProperty({
//     type: [AttributeDto],
//     description: 'Toujours un tableau d’attributs (object possible, récursif via value).',
//   })
//   @IsArray()
//   @Type(() => AttributeDto)
//   attribus: AttributeDto[];

//   @ApiPropertyOptional({
//     type: () => [ComposantDto],
//     description: 'Composants enfants (récursif, optionnel).',
//   })
//   @IsOptional()
//   @IsArray()
//   @Type(() => ComposantDto)
//   composant?: ComposantDto[];
// }
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { AttributeDto } from './attribute.dto';

export class ComposantDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  id?: number;

  @ApiProperty({ example: 'Pharmacie' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Dépôt et dispensation internes' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'SIMPLE', enum: ['SIMPLE','COMPLEXE'] })
  @IsIn(['SIMPLE','COMPLEXE'])
  type: string;

  @ApiProperty({ example: { lat: 0, log: 0 } })
  @IsObject()
  location: any;

  @ApiProperty({ example: [] })
  @IsArray()
  images: any[];

  @ApiProperty({
    type: [AttributeDto],
    description: 'Toujours un tableau d’attributs (object possible, récursif via value).',
  })
  @IsArray()
  @Type(() => AttributeDto)
  attribus: AttributeDto[];

  @ApiPropertyOptional({
    type: () => [ComposantDto],
    description: 'Composants enfants (récursif, optionnel).',
  })
  @IsOptional()
  @IsArray()
  @Type(() => ComposantDto)
  composant?: ComposantDto[];
}
