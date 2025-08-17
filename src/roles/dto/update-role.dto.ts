// src/roles/dto/update-role.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({ example: 'COMMUNE', required: false })
  @IsOptional()
  @IsNotEmpty()
  nom?: string;
}
