import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeUtilisateur } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    enum: TypeUtilisateur,
    example: TypeUtilisateur.INSTITUT,
    description:
      'Type du compte ciblé. Obligatoire car email/téléphone peuvent exister sur plusieurs comptes.',
  })
  @IsEnum(TypeUtilisateur)
  type: TypeUtilisateur;

  @ApiPropertyOptional({
    example: '+237690000000',
    description: 'Téléphone du compte',
  })
  @ValidateIf((o) => !o.email)
  @IsString()
  @IsOptional()
  telephone?: string;

  @ApiPropertyOptional({
    example: 'contact@dezoumay.com',
    description: 'Email du compte',
  })
  @ValidateIf((o) => !o.telephone)
  @IsEmail()
  @IsOptional()
  email?: string;
}