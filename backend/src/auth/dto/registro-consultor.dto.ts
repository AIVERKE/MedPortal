import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { RegistroPersonaBaseDto } from './registro-persona-base.dto';

export class RegistroConsultorDto extends RegistroPersonaBaseDto {
  @ApiProperty({ description: 'Tipo de servicio del consultor', example: '1' })
  @IsNotEmpty({ message: 'El tipo de servicio es obligatorio' })
  @IsString()
  @MaxLength(50)
  tipoServicio: string;

  @ApiProperty({ description: 'Unidad a la que pertenece', example: 'Unidad de Postas' })
  @IsNotEmpty({ message: 'La unidad es obligatoria' })
  @IsString()
  @MaxLength(100)
  unidad: string;

  @ApiProperty({ description: 'Fecha de inicio del contrato', example: '2026-01-01' })
  @IsNotEmpty({ message: 'La fecha de inicio del contrato es obligatoria' })
  @IsDateString()
  fechaInicioContrato: string;

  @ApiProperty({ description: 'Fecha de fin del contrato', example: '2026-12-31' })
  @IsNotEmpty({ message: 'La fecha de fin del contrato es obligatoria' })
  @IsDateString()
  fechaFinContrato: string;

  @ApiProperty({ description: 'Cargo del consultor', example: 'Secretario' })
  @IsNotEmpty({ message: 'El cargo es obligatorio' })
  @IsString()
  @MaxLength(100)
  cargo: string;
}
