import { ApiProperty } from '@nestjs/swagger';
import { TypeUtilisateur } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: '+237690000000',
    description: 'Numéro de téléphone utilisé pour la connexion',
  })
  @IsString()
  telephone: string;

  @ApiProperty({
    enum: TypeUtilisateur,
    example: TypeUtilisateur.CLIENT,
    description:
      'Type de compte à connecter. Obligatoire car le même téléphone peut exister sur plusieurs comptes.',
  })
  @IsEnum(TypeUtilisateur)
  type: TypeUtilisateur;

  @ApiProperty({
    example: 'P@ssw0rd!',
    description: 'Mot de passe du compte',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  mot_de_passe: string;
}