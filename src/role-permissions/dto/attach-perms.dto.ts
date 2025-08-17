// src/role-permissions/dto/attach-perms.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class AttachPermsDto {
  @ApiProperty({ example: 2 }) @Type(() => Number) @IsInt() @IsNotEmpty() roleId!: number;
  @ApiProperty({ example: [1,3,5] }) @IsArray() @ArrayNotEmpty() @Type(() => Number) permissionIds!: number[];
}

export class DetachPermsDto {
  @ApiProperty({ example: 2 }) @Type(() => Number) @IsInt() @IsNotEmpty() roleId!: number;
  @ApiProperty({ example: [1,3,5] }) @IsArray() @ArrayNotEmpty() @Type(() => Number) permissionIds!: number[];
}
