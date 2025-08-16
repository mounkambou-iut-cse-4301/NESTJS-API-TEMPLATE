import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Jean Dupont' })
  @IsString() @IsNotEmpty()
  nom: string;

  @ApiProperty({ example: 'jean.dupont@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongP@ssw0rd!' })
  @IsString() @MinLength(8)
  mot_de_passe: string;

  @ApiProperty({
    description: 'Numéro au format international Cameroun. Ex: +237699001122',
    example: '+237699001122',
  })
  @IsString() @IsNotEmpty()
  // Tolérant : +237 suivi de 8 à 9 chiffres (selon écriture locale)
  @Matches(/^\+237\d{8,9}$/, { message: 'Numéro de téléphone invalide (doit commencer par +237 et contenir 8 à 9 chiffres après).' })
  telephone: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @IsInt()
  communeId?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  is_verified?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  is_block?: boolean;

  @ApiPropertyOptional({
    description: 'Image base64 (ou URL http). Sera envoyée à Cloudinary.',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
  })
  @IsOptional() @IsString()
  photoBase64?: string;
}
