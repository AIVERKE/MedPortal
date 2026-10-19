import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateDerivacionDto } from './create-derivacion.dto';

export class UpdateDerivacionDto extends PartialType(CreateDerivacionDto) {}
