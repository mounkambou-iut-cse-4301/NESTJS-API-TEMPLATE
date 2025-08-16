import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DistanceDto {
  @ApiProperty({ description: 'ID BigInt du point A' }) @IsString() fromId: string;
  @ApiProperty({ description: 'ID BigInt du point B' }) @IsString() toId: string;
}
