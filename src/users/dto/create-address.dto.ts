import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Cameroun' })
  @IsString()
  country: string;

  @ApiProperty({ example: 'Yaoundé' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Bastos, Rue 1.234' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: 11.5123 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 3.8667 })
  @IsOptional()
  @IsNumber()
  latitude?: number;
}