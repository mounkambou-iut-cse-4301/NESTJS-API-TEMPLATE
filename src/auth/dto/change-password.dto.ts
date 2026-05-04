import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: '1234',
    description: 'Ancien mot de passe.',
  })
  @IsString()
  @IsNotEmpty()
  old_password: string;

  @ApiProperty({
    example: 'new-password-123',
    description: 'Nouveau mot de passe.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  new_password: string;
}