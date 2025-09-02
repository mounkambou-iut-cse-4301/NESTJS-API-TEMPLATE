import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteInfrastructureDto {
  @ApiProperty({ example: 'Site démoli (sécurité publique).' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: 'Fichier justificatif: dataURL base64 (image/pdf) ou URL http(s).',
    example: 'data:application/pdf;base64,JVBERi0xLjcKJc...'
  })
  @IsString()
  @IsNotEmpty()
  proofFile: string;
}
