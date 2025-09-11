import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsObject,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/** Validator: string | string[] */
export function IsStringOrStringArray(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStringOrStringArray',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (value === undefined || value === null) return true;
          if (typeof value === 'string') return value.trim().length >= 0;
          if (Array.isArray(value)) return value.every(v => typeof v === 'string');
          return false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} doit être une chaîne ou un tableau de chaînes.`;
        },
      },
    });
  };
}

export class UpdateAttribusDto {
  @ApiPropertyOptional({
    description: 'Sous-ensemble JSON à fusionner dans attribus (deep-merge, tableaux remplacés)',
    type: 'object',
    additionalProperties: true, // <- évite l’erreur Swagger
    example: { etat: 'FONCTIONNEL', contact: { tel: '699000111' } },
  })
  @IsOptional()
  @IsObject()
  // Si jamais on reçoit une chaîne JSON, on tente de parser proprement
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
      } catch {
        return {}; // on laisse la validation métier du service lever l’erreur si besoin
      }
    }
    return {};
  })
  attribus?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Nouveau nom (facultatif)' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value === undefined ? undefined : String(value).trim()
  )
  name?: string;

  @ApiPropertyOptional({
    description: 'Description (facultative). Utiliser null pour effacer.',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) =>
   value === undefined ? undefined : String(value).trim()
  )
  description?: string;

  @ApiPropertyOptional({
    description:
      'Images (URL http(s) ou data:base64). Accepte string OU string[]. Si fourni, remplace entièrement la colonne images.',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: [
      'https://cdn.example.com/pic.jpg',
      'data:image/png;base64,iVBORw0...',
    ],
  })
  @IsOptional()
  @IsStringOrStringArray({
    message:
      'images doit être une chaîne (URL/base64) ou un tableau de chaînes.',
  })
  images?: string | string[];
}
