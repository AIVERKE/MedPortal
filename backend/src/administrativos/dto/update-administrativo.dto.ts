import { PartialType } from '@nestjs/swagger';
import { CreateAdministrativoDto } from './create-administrativo.dto';

export class UpdateAdministrativoDto extends PartialType(CreateAdministrativoDto) { }
