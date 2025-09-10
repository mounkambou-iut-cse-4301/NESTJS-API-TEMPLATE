import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateAttribusDto {
  @ApiProperty({
    description:
      'Sous-ensemble JSON à fusionner dans attribus (deep-merge, tableaux remplacés)',
    type: 'object',
    // Autoriser n’importe quelles paires clé/valeur (y compris objets imbriqués)
    additionalProperties: true,
    example: { etat: 'FONCTIONNEL', contact: { tel: '699000111' } },
  })
  @IsObject()
  attribus!: Record<string, any>;
}
