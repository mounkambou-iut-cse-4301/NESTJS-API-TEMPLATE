import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de réinitialisation',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsJWT()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Code de vérification à 6 chiffres',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Nouveau mot de passe',
    example: 'MonNouveauMotDePasse@2026',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  new_password: string;
}