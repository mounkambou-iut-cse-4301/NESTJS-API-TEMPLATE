import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type as T } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class ComposantRecordDto {
  @ApiProperty({ example: 'Pharmacie' }) @IsString() name: string;

  @ApiPropertyOptional({ example: 'Dispensation interne' })
  @IsOptional() @IsString() description?: string;

  @ApiProperty({ example: 'SIMPLE', enum: ['SIMPLE','COMPLEXE'] })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsIn(['SIMPLE','COMPLEXE']) type: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean() existingInfrastructure?: boolean;

  @ApiProperty({ example: { lat: 0, log: 0 } })
  @IsObject() location: any;

  @ApiProperty({ example: [] })
  @IsArray() images: any[];

  @ApiPropertyOptional({
    description: 'Attributs réels de ce composant (objet clé → valeur)',
    example: { nombreLit: 5, largeur: 3.0 }
  })
  @IsOptional() @IsObject() attribus?: any;

  @ApiPropertyOptional({ description: 'Composants enfants (optionnel, récursif)' })
  @IsOptional() @IsArray() composant?: any[];

  @ApiPropertyOptional({ description: 'ID record enfant (renseignement retour serveur)', example: '123' })
  @IsOptional() @IsString() recordId?: string;
}

export class CreateInfrastructureDto {
  @ApiProperty({ description: 'FK vers TypeInfrastructure.id', example: 1 })
  @Transform(({ value }) => Number(value)) @IsInt() @Min(1)
  typeId: number;

  @ApiProperty({ example: 'Hopital de Djongolo' }) @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Bâtiment principal réhabilité en 2024' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  existing_infrastructure?: boolean;

  @ApiProperty({ example: 'COMPLEXE', enum: ['SIMPLE','COMPLEXE'] })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsIn(['SIMPLE','COMPLEXE'])
  type: string;

  /* Territoire */
  @ApiProperty({ example: 1 }) @Transform(({ value }) => Number(value)) @IsInt() @Min(1) regionId: number;
  @ApiProperty({ example: 1 }) @Transform(({ value }) => Number(value)) @IsInt() @Min(1) departementId: number;
  @ApiProperty({ example: 1 }) @Transform(({ value }) => Number(value)) @IsInt() @Min(1) arrondissementId: number;
  @ApiProperty({ example: 1 }) @Transform(({ value }) => Number(value)) @IsInt() @Min(1) communeId: number;
/* Créateur (nullable côté DB, mais on l’exige côté API pour tracer, ou fallback sur user connecté) */
  @ApiProperty({ example: 5, description: 'ID de l’utilisateur créateur. Si omis, on prendra l’utilisateur connecté.' })
  @Transform(({ value }) => Number(value)) @IsInt() @Min(1)
  utilisateurId: number;  


  /* Classification */
  @ApiPropertyOptional({ example: 1 }) @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1) domaineId?: number;

  @ApiPropertyOptional({ example: 2 }) @Transform(({ value }) => value === undefined ? undefined : Number(value))
  @IsOptional() @IsInt() @Min(1) sousdomaineId?: number;

  /* Données réelles */
  @ApiProperty({ example: { lat: 1111, log: 212321 } })
  @IsObject() location: any;

  @ApiProperty({ example: ['https://example.com/img.jpg'] })
  @IsArray() images: any[];

  @ApiProperty({
    description: 'Attributs réels (objet clé → valeur)',
    example: { NombreBlocOperatoire: 2, NombrePharmacie: 1 }
  })
  @IsObject() attribus: any;

  @ApiPropertyOptional({ type: [ComposantRecordDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @T(() => ComposantRecordDto)
  composant?: ComposantRecordDto[];
}
