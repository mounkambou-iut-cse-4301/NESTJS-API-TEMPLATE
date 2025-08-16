import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateArrondissementDto {
  @ApiProperty({ example: 'Yaoundé I' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({ example: 'Yaounde I' })
  @IsOptional() @IsString()
  nom_en?: string;

  @ApiPropertyOptional({ example: 'YDE1' })
  @IsOptional() @IsString()
  code?: string;

  @ApiProperty({ example: 10, description: 'FK Departement.id' })
  @IsInt()
  departementId: number;
}
