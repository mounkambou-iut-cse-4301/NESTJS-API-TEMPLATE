import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class HeatmapTileDto {
  @ApiProperty() @IsInt() @Min(0) z: number;
  @ApiProperty() @IsInt() @Min(0) x: number;
  @ApiProperty() @IsInt() @Min(0) y: number;

  @ApiProperty({ required: false }) @IsOptional() @IsInt() typeId?: number;
}
