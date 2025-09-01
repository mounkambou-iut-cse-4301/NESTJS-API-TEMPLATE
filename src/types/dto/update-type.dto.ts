// src/types/dto/update-type.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateTypeDto } from './create-type.dto';
export class UpdateTypeDto extends PartialType(CreateTypeDto) {}
