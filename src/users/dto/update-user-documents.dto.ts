import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateDocumentDto } from './create-document.dto';

export class UpdateUserDocumentsDto {
  @ApiProperty({
    type: [CreateDocumentDto],
    description: 'Remplace tous les documents du compte',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDocumentDto)
  documents: CreateDocumentDto[];
}