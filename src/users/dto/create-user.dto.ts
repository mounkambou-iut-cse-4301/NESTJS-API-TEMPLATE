import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Genre, TypeUtilisateur } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateAddressDto } from './create-address.dto';
import { CreateDocumentDto } from './create-document.dto';

export class CreateUserDto {
  @ApiProperty({ example: 'Institut Élégance Plus' })
  @IsString()
  nom: string;

  @ApiProperty({ example: 'contact@dezoumay.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+237690000000' })
  @IsString()
  telephone: string;

  @ApiProperty({
    example: 'MotDePasse@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  mot_de_passe: string;

  @ApiPropertyOptional({
    example: '1998-04-15',
  })
  @IsOptional()
  @IsDateString()
  date_naissance?: string;

  @ApiPropertyOptional({
    enum: Genre,
    example: Genre.F,
  })
  @IsOptional()
  @IsEnum(Genre)
  genre?: Genre;

  @ApiProperty({
    enum: TypeUtilisateur,
    example: TypeUtilisateur.CLIENT,
  })
  @IsEnum(TypeUtilisateur)
  type: TypeUtilisateur;

  @ApiPropertyOptional({
    example: 'data:image/jpeg;base64,/9j/4AAQSk...',
    description: 'Photo de profil base64 ou URL',
  })
  @IsOptional()
  @IsString()
  photo_url?: string;

  @ApiPropertyOptional({
    type: [CreateAddressDto],
    description: 'Adresses initiales',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAddressDto)
  adresses?: CreateAddressDto[];

  @ApiPropertyOptional({
    type: [CreateDocumentDto],
    description:
      'Documents/images. Obligatoire si type = INSTITUT',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDocumentDto)
  documents?: CreateDocumentDto[];
}