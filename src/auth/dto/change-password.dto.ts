// src/auth/dto/change-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Ancien mot de passe', example: 'AncienMDP!234' })
  @IsNotEmpty()
  old_password!: string;

  @ApiProperty({ description: 'Nouveau mot de passe (min. 8 caractères)', example: 'NouveauMDP!234' })
  @IsNotEmpty()
  @MinLength(8)
  new_password!: string;
}
