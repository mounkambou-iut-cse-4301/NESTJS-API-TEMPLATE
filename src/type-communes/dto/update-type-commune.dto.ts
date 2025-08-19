import { PartialType } from '@nestjs/swagger';
import { CreateTypeCommuneDto } from './create-type-commune.dto';

export class UpdateTypeCommuneDto extends PartialType(CreateTypeCommuneDto) {}
