import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'jwt-reset-token',
    description: 'Token de réinitialisation reçu après forgot-password.',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: '123456',
    description: 'Code de vérification reçu par email.',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'new-password-123',
    description: 'Nouveau mot de passe.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  new_password: string;
}