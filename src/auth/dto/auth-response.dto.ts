import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 'Identifiants invalides.' })
  message: string;

  @ApiProperty({ example: 'Invalid credentials.' })
  messageE: string;
}

export class GenericMessageResponseDto {
  @ApiProperty({ example: 'Opération effectuée avec succès.' })
  message: string;

  @ApiProperty({ example: 'Operation completed successfully.' })
  messageE: string;
}

export class AuthRoleDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'SUPERADMIN' })
  name: string;
}

export class AuthUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Super' })
  firstName: string;

  @ApiProperty({ example: 'Administrateur' })
  lastName: string;

  @ApiProperty({ example: 'Super Administrateur' })
  fullName: string;

  @ApiProperty({ example: 'superadmin@collect-femme.com' })
  email: string;

  @ApiProperty({ example: '+237692473511' })
  phone: string;

  @ApiPropertyOptional({
    example: 'https://cloudinary.com/profile.jpg',
    nullable: true,
  })
  picture?: string | null;

  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiProperty({ example: false })
  isBlock: boolean;
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

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;

  @ApiProperty({ type: [AuthRoleDto] })
  roles: AuthRoleDto[];

  @ApiProperty({
    type: [String],
    example: ['FICHE_CREATE', 'FICHE_VALIDATE'],
  })
  permissions: string[];
}

export class ForgotPasswordDataDto {
  @ApiPropertyOptional({
    example: 'jwt-reset-token',
    nullable: true,
  })
  token: string | null;

  @ApiPropertyOptional({
    example: '15m',
    nullable: true,
  })
  expires_in: string | null;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({
    example:
      'Si le compte existe, les informations de réinitialisation ont été générées.',
  })
  message: string;

  @ApiProperty({
    example: 'If the account exists, reset information has been generated.',
  })
  messageE: string;

  @ApiProperty({ type: ForgotPasswordDataDto })
  data: ForgotPasswordDataDto;
}