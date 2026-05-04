import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: '+237692473511',
    description: 'Numéro de téléphone de l’utilisateur.',
  })
  @IsString()
  @IsNotEmpty()
  telephone: string;

  @ApiProperty({
    example: '1234',
    description: 'Mot de passe de l’utilisateur.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  mot_de_passe: string;
}