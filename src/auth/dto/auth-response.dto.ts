import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeUtilisateur } from '@prisma/client';

export class ErrorResponseDto {
  @ApiProperty({ example: 'Identifiants invalides.' })
  message: string;

  @ApiProperty({ example: 'Invalid credentials.' })
  messageE: string;
}

export class GenericMessageResponseDto {
  @ApiProperty({ example: 'Mot de passe modifié avec succès.' })
  message: string;

  @ApiProperty({ example: 'Password changed successfully.' })
  messageE: string;
}

export class AuthRoleDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'CLIENT' })
  nom: string;
}

export class AuthUserDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 'Jean Dupont' })
  nom: string;

  @ApiProperty({ example: 'jean@demo.com' })
  email: string;

  @ApiProperty({ example: '+237690000000' })
  telephone: string;

  @ApiProperty({
    enum: TypeUtilisateur,
    example: TypeUtilisateur.CLIENT,
  })
  type: TypeUtilisateur;

  @ApiProperty({ example: false })
  is_verified: boolean;

  @ApiProperty({ example: false })
  is_block: boolean;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'Connexion réussie.' })
  message: string;

  @ApiProperty({ example: 'Login successful.' })
  messageE: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({ type: () => AuthUserDto })
  user: AuthUserDto;

  @ApiProperty({ type: () => [AuthRoleDto] })
  roles: AuthRoleDto[];

  @ApiProperty({
    type: [String],
    example: ['RESERVATION_READ', 'PROFILE_UPDATE'],
  })
  permissions: string[];
}

export class ForgotPasswordDataDto {
  @ApiPropertyOptional({
    nullable: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '15m',
  })
  expires_in: string | null;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({
    example: 'Si le compte existe, les informations de réinitialisation ont été générées.',
  })
  message: string;

  @ApiProperty({
    example: 'If the account exists, reset information has been generated.',
  })
  messageE: string;

  @ApiProperty({ type: () => ForgotPasswordDataDto })
  data: ForgotPasswordDataDto;
}