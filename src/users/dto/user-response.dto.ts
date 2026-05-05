import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeUtilisateur } from '@prisma/client';

export class UserRegionDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'NORD' })
  name: string;

  @ApiPropertyOptional({ example: 'NORTH', nullable: true })
  nameEn?: string | null;
}

export class UserDepartementDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'BENOUE' })
  name: string;

  @ApiPropertyOptional({ example: 'BENUE', nullable: true })
  nameEn?: string | null;
}

export class UserGroupeDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'GROUPE 1' })
  name: string;
}

export class UserZoneDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiPropertyOptional({ example: 'ZONE GAROUA', nullable: true })
  name?: string | null;
}

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Jean' })
  firstName: string;

  @ApiProperty({ example: 'Tchinda' })
  lastName: string;

  @ApiProperty({ example: 'Jean Tchinda' })
  fullName: string;

  @ApiProperty({ example: 'agent1@collect-femme.com' })
  email: string;

  @ApiProperty({ example: '+237690000001' })
  phone: string;

  @ApiProperty({
    enum: TypeUtilisateur,
    example: TypeUtilisateur.AGENT_COLLECTE,
  })
  type: TypeUtilisateur;

  @ApiPropertyOptional({ example: null, nullable: true })
  picture?: string | null;

  @ApiProperty({ example: false })
  isBlock: boolean;

  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiProperty({ example: false })
  isDeleted: boolean;

  @ApiProperty({ example: 0 })
  loginAttempt: number;

  @ApiPropertyOptional({ example: 1, nullable: true })
  regionId?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  departementId?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  groupeId?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  zoneId?: number | null;

  @ApiPropertyOptional({ type: UserRegionDto, nullable: true })
  region?: UserRegionDto | null;

  @ApiPropertyOptional({ type: UserDepartementDto, nullable: true })
  departement?: UserDepartementDto | null;

  @ApiPropertyOptional({ type: UserGroupeDto, nullable: true })
  groupe?: UserGroupeDto | null;

  @ApiPropertyOptional({ type: UserZoneDto, nullable: true })
  zone?: UserZoneDto | null;

  @ApiProperty({ example: '2026-05-04T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-04T10:00:00.000Z' })
  updatedAt: string;
}

export class UserSingleResponseDto {
  @ApiProperty({ example: 'Utilisateur récupéré avec succès.' })
  message: string;

  @ApiProperty({ example: 'User fetched successfully.' })
  messageE: string;

  @ApiProperty({ type: UserResponseDto })
  data: UserResponseDto;
}

export class UserListMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class UserListResponseDto {
  @ApiProperty({ example: 'Liste des utilisateurs récupérée avec succès.' })
  message: string;

  @ApiProperty({ example: 'Users fetched successfully.' })
  messageE: string;

  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty({ type: UserListMetaDto })
  meta: UserListMetaDto;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 'Utilisateur introuvable.' })
  message: string;

  @ApiProperty({ example: 'User not found.' })
  messageE: string;
}