import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  nom?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Si fourni, sera re-hashé' })
  @IsOptional() @IsString() @MinLength(8)
  mot_de_passe?: string;

  @ApiPropertyOptional({
    description: 'Numéro au format international Cameroun. Ex: +237699001122',
    example: '+237699001122',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+237\d{8,9}$/, { message: 'Numéro de téléphone invalide (doit commencer par +237 et contenir 8 à 9 chiffres après).' })
  telephone?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsInt()
  communeId?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  is_verified?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  is_block?: boolean;

  @ApiPropertyOptional({
    description: 'Image base64 (ou URL http). Upload Cloudinary si base64.',
  })
  @IsOptional() @IsString()
  photoBase64?: string;
}
