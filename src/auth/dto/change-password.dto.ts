import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Ancien mot de passe',
    example: 'AncienMDP!234',
  })
  @IsString()
  @IsNotEmpty()
  old_password: string;

  @ApiProperty({
    description: 'Nouveau mot de passe',
    example: 'NouveauMDP!234',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  new_password: string;
}