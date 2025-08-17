// src/roles/dto/create-role.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'COMMUNE', description: 'Nom unique du rôle (SUPER_ADMIN | MINISTERE | COMMUNE, etc.)' })
  @IsNotEmpty()
  nom!: string;
}
