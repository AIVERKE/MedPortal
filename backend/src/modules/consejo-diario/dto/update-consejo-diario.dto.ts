import { PartialType } from '@nestjs/swagger';
import { CreateConsejoDiarioDto } from './create-consejo-diario.dto';

export class UpdateConsejoDiarioDto extends PartialType(
  CreateConsejoDiarioDto,
) {}
