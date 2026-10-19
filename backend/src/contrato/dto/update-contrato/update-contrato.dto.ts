import { PartialType } from '@nestjs/swagger';
import { CreateContrato } from '../create-contrato/create-contrato';

export class UpdateContrato extends PartialType(CreateContrato) {}
