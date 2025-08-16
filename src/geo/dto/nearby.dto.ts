import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class NearbyDto {
  @ApiProperty() @IsNumber() lat: number;
  @ApiProperty() @IsNumber() lon: number;
  @ApiProperty({ description: 'Rayon en mètres', default: 5000 }) @IsInt() @Min(1) radius: number = 5000;

  @ApiProperty({ required: false }) @IsOptional() @IsInt() typeId?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() domaineId?: number;

  @ApiProperty({ required: false, default: 1 }) @IsOptional() @IsInt() @Min(1) page?: number = 1;
  @ApiProperty({ required: false, default: 100 }) @IsOptional() @IsInt() @Min(1) pageSize?: number = 100;
}
