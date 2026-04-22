import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDocumentDto {
  @ApiPropertyOptional({
    example: 'Images institut',
    description: 'Nom logique du document',
  })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiProperty({
    type: [String],
    example: [
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
    ],
    description:
      'Tableau d’images/documents en base64 ou URLs déjà existantes',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  images: string[];
}