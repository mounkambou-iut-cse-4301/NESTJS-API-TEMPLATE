import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsInt, Min, ValidateNested } from 'class-validator';
import { ParcourItemDto } from './parcour-item.dto';

export class ParoursBulkDto {
  @ApiProperty({ type: [ParcourItemDto] })
  @ValidateNested({ each: true }) @Type(() => ParcourItemDto) @ArrayMinSize(1)
  items!: ParcourItemDto[];

  @ApiProperty({ description: 'ID utilisateur collecteur' })
  @IsInt() @Min(1)
  collecteurId!: number;
}
