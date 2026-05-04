import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiPropertyOptional({
    example: '+237692473511',
    description: 'Téléphone du compte à récupérer.',
  })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional({
    example: 'superadmin@collect-femme.com',
    description: 'Email du compte à récupérer.',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}