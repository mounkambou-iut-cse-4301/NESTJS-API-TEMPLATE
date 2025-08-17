// src/user-roles/dto/assign-roles.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignRolesDto {
  @ApiProperty({ example: 10 }) @Type(() => Number) @IsInt() @IsNotEmpty() userId!: number;
  @ApiProperty({ example: [1,2] }) @IsArray() @ArrayNotEmpty() @Type(() => Number) roleIds!: number[];
}

export class RevokeRolesDto {
  @ApiProperty({ example: 10 }) @Type(() => Number) @IsInt() @IsNotEmpty() userId!: number;
  @ApiProperty({ example: [1,2] }) @IsArray() @ArrayNotEmpty() @Type(() => Number) roleIds!: number[];
}
