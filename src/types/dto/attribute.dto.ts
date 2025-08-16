import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString } from 'class-validator';

export class AttributeDto {
  @ApiProperty({ example: 'NombreChambre' })
  @IsDefined()
  @IsString()
  key: string;

  @ApiProperty({ example: 'number', description: 'ex: number | string | enum' })
  @IsDefined()
  @IsString()
  type: string;

  @ApiPropertyOptional({
    description: 'Pour type=enum, peut être une string CSV ("a, b, c") ou un tableau. Sinon null/valeur.',
    example: null,
  })
  @IsOptional()
  // volontairement non typé pour laisser passer array | string | null
  value?: any;
}
