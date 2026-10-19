import { PartialType } from '@nestjs/swagger';
import { CreateConsultorDto } from './create-consultor.dto';

export class UpdateConsultorDto extends PartialType(CreateConsultorDto) { }
