import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'agent@sigcom.cm' })
  @IsEmail()
  email: string;
}
