// src/auth/dto/reset-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token de réinitialisation reçu par email (JWT)', example: 'eyJhbGciOi...'})
  @IsJWT()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ description: 'Code de vérification à 6 chiffres reçu par email', example: '123456' })
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ description: 'Nouveau mot de passe (min. 8 caractères)', example: 'MonNouveauMDP!234' })
  @IsNotEmpty()
  @MinLength(8)
  new_password!: string;
}
