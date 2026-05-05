import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeUtilisateur } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

function toOptionalInt({ value }: { value: unknown }) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? value : numberValue;
}

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateUserDto {
  @ApiProperty({
    example: 'Agent',
    description: 'Prénom de l’utilisateur.',
  })
  @IsString()
  @Transform(trimString)
  firstName: string;

  @ApiProperty({
    example: 'Collecte Un',
    description: 'Nom de l’utilisateur.',
  })
  @IsString()
  @Transform(trimString)
  lastName: string;

  @ApiProperty({
    example: 'agent1@collect-femme.com',
    description: 'Adresse email unique de l’utilisateur.',
  })
  @IsEmail()
  @Transform(trimString)
  email: string;

  @ApiProperty({
    example: '+237690000001',
    description: 'Numéro de téléphone unique de l’utilisateur.',
  })
  @IsString()
  @Transform(trimString)
  phone: string;

  @ApiProperty({
    example: '1234',
    description: 'Mot de passe. Il sera hashé côté backend.',
  })
  @IsString()
  @MinLength(4)
  password: string;

  @ApiProperty({
    enum: TypeUtilisateur,
    example: TypeUtilisateur.AGENT_COLLECTE,
    description:
      'Type métier de l’utilisateur : AGENT_COLLECTE, POINT_FOCAL, COORDINATION, ADMIN ou SUPERADMIN.',
  })
  @IsEnum(TypeUtilisateur)
  type: TypeUtilisateur;

  @ApiPropertyOptional({
    example: 1,
    nullable: true,
    description: 'ID de la région. Peut être null ou absent au début.',
  })
  @IsOptional()
  @Transform(toOptionalInt)
  @IsInt()
  @Min(1)
  regionId?: number | null;

  @ApiPropertyOptional({
    example: 1,
    nullable: true,
    description: 'ID du département. Peut être null ou absent au début.',
  })
  @IsOptional()
  @Transform(toOptionalInt)
  @IsInt()
  @Min(1)
  departementId?: number | null;

  @ApiPropertyOptional({
    example: 1,
    nullable: true,
    description: 'ID du groupe. Peut être null ou absent au début.',
  })
  @IsOptional()
  @Transform(toOptionalInt)
  @IsInt()
  @Min(1)
  groupeId?: number | null;

  @ApiPropertyOptional({
    example: 1,
    nullable: true,
    description: 'ID de la zone. Peut être null ou absent au début.',
  })
  @IsOptional()
  @Transform(toOptionalInt)
  @IsInt()
  @Min(1)
  zoneId?: number | null;

  @ApiPropertyOptional({
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
    nullable: true,
    description:
      'Photo de profil en URL ou base64. Si base64, elle sera optimisée puis envoyée sur Cloudinary en arrière-plan.',
  })
  @IsOptional()
  @IsString()
  picture?: string | null;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description:
      'Photo de profil envoyée en multipart/form-data. Champ utilisé avec FileInterceptor("pictureFile").',
  })
  @IsOptional()
  pictureFile?: any;
}