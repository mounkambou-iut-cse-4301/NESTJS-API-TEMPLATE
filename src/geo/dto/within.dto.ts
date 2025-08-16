import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GeoWithinDto {
  @ApiProperty({
    description: 'GeoJSON Polygon',
    example: { type: 'Polygon', coordinates: [[[11.49,3.85],[11.53,3.85],[11.53,3.89],[11.49,3.89],[11.49,3.85]]] },
  })
  @IsArray() polygon: any;

  @ApiProperty({ required: false }) @IsOptional() @IsInt() typeId?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() domaineId?: number;

  @ApiProperty({ required: false, default: 1 }) @IsOptional() @IsInt() @Min(1) page?: number = 1;
  @ApiProperty({ required: false, default: 1000 }) @IsOptional() @IsInt() @Min(1) pageSize?: number = 1000;
}
