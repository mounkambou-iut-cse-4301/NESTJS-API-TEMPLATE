import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Genre, TypeUtilisateur } from '@prisma/client';

export class ErrorResponseDto {
  @ApiProperty({ example: 'Utilisateur introuvable.' })
  message: string;

  @ApiProperty({ example: 'User not found.' })
  messageE: string;
}

export class GenericMessageResponseDto {
  @ApiProperty({ example: 'Opération effectuée avec succès.' })
  message: string;

  @ApiProperty({ example: 'Operation completed successfully.' })
  messageE: string;
}

export class RoleNameDto {
  @ApiProperty({ example: 'CLIENT' })
  nom: string;
}

export class AddressResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Cameroun' })
  country: string;

  @ApiProperty({ example: 'Yaoundé' })
  city: string;

  @ApiProperty({ example: 'Bastos, Rue 1.234' })
  address: string;

  @ApiPropertyOptional({ example: 11.5123, nullable: true })
  longitude?: number | null;

  @ApiPropertyOptional({ example: 3.8667, nullable: true })
  latitude?: number | null;
}

export class DocumentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiPropertyOptional({
    example: 'Images institut',
    nullable: true,
  })
  nom?: string | null;

  @ApiProperty({
    type: [String],
    example: ['https://res.cloudinary.com/.../image.jpg'],
  })
  images: string[];
}

export class UserResponseDto {
  @ApiProperty({ example: 14 })
  id: number;

  @ApiProperty({ example: 'Institut Élégance Plus' })
  nom: string;

  @ApiProperty({ example: 'contact@dezoumay.com' })
  email: string;

  @ApiProperty({ example: '+237690000000' })
  telephone: string;

  @ApiPropertyOptional({
    example: '1998-04-15T00:00:00.000Z',
    nullable: true,
  })
  date_naissance?: string | null;

  @ApiPropertyOptional({
    enum: Genre,
    nullable: true,
    example: Genre.F,
  })
  genre?: Genre | null;

  @ApiProperty({
    enum: TypeUtilisateur,
    example: TypeUtilisateur.INSTITUT,
  })
  type: TypeUtilisateur;

  @ApiProperty({ example: true })
  is_verified: boolean;

  @ApiProperty({ example: false })
  is_block: boolean;

  @ApiProperty({ example: 0 })
  nombre_attempts: number;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/.../profile.jpg',
    nullable: true,
  })
  photo_url?: string | null;

  @ApiPropertyOptional({
    example: '2026-04-21T10:10:00.000Z',
    nullable: true,
  })
  derniere_connexion?: string | null;

  @ApiProperty({
    example: '2026-04-21T09:00:00.000Z',
  })
  created_at: string;

  @ApiProperty({
    example: '2026-04-21T09:00:00.000Z',
  })
  updated_at: string;

  @ApiProperty({
    type: [String],
    example: ['INSTITUT'],
  })
  roles: string[];

  @ApiProperty({
    type: [AddressResponseDto],
  })
  adresses: AddressResponseDto[];

  @ApiProperty({
    type: [DocumentResponseDto],
  })
  documents: DocumentResponseDto[];
}

export class UserSingleResponseDto {
  @ApiProperty({ example: 'Utilisateur récupéré avec succès.' })
  message: string;

  @ApiProperty({ example: 'User fetched successfully.' })
  messageE: string;

  @ApiProperty({ type: () => UserResponseDto })
  data: UserResponseDto;
}

export class UsersListMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 23 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class UsersListResponseDto {
  @ApiProperty({ example: 'Liste des utilisateurs récupérée avec succès.' })
  message: string;

  @ApiProperty({ example: 'Users fetched successfully.' })
  messageE: string;

  @ApiProperty({
    type: [UserResponseDto],
  })
  data: UserResponseDto[];

  @ApiProperty({
    type: () => UsersListMetaDto,
  })
  meta: UsersListMetaDto;
}

export class AddressSingleResponseDto {
  @ApiProperty({ example: 'Adresse enregistrée avec succès.' })
  message: string;

  @ApiProperty({ example: 'Address saved successfully.' })
  messageE: string;

  @ApiProperty({ type: () => AddressResponseDto })
  data: AddressResponseDto;
}

export class AddressListResponseDto {
  @ApiProperty({ example: 'Adresses récupérées avec succès.' })
  message: string;

  @ApiProperty({ example: 'Addresses fetched successfully.' })
  messageE: string;

  @ApiProperty({
    type: [AddressResponseDto],
  })
  data: AddressResponseDto[];
}

export class DocumentListResponseDto {
  @ApiProperty({ example: 'Documents récupérés avec succès.' })
  message: string;

  @ApiProperty({ example: 'Documents fetched successfully.' })
  messageE: string;

  @ApiProperty({
    type: [DocumentResponseDto],
  })
  data: DocumentResponseDto[];
}