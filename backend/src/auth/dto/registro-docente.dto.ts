import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { RegistroPersonaBaseDto } from './registro-persona-base.dto';

export class RegistroDocenteDto extends RegistroPersonaBaseDto {
  @ApiPropertyOptional({ description: 'Número de ítem del docente', example: 'ITEM-456' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  numeroItem?: string;

  @ApiPropertyOptional({ description: 'Facultad del docente', example: 'Facultad de Medicina' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  facultad?: string;

  @ApiPropertyOptional({ description: 'Tipo de contrato (Interino/Contratado)', example: 'Interino' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  interinoContratado?: string;
}
