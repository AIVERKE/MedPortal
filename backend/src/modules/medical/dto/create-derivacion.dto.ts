import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateDerivacionDto {
  @ApiProperty({ description: 'ID de la historia clínica', example: 1 })
  @IsInt()
  @IsNotEmpty()
  idHcl: number;

  @ApiProperty({ description: 'ID de la consulta de origen', example: 1 })
  @IsInt()
  @IsOptional()
  idConsultaOrigen?: number;

  @ApiProperty({
    description: 'ID de la especialidad medica a la que se deriva',
    example: 2,
  })
  @IsInt()
  @IsNotEmpty()
  idEspecialidad: number;

  @ApiProperty({
    description: 'ID de la persona que emite la derivacion',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  idPersonaEmisor: number;

  @ApiProperty({ description: 'Motivo de referencia', example: 'Derivación por especialista' })
  @IsString()
  @IsOptional()
  motivoReferencia?: string;

  @ApiProperty({ description: 'Diagnostico presuntivo', example: 'Gingivitis' })
  @IsString()
  @IsOptional()
  diagnosticoPresuntivo?: string;

  @ApiProperty({ description: 'Resumen de salud', example: 'Paciente estable' })
  @IsString()
  @IsOptional()
  resumenSalud?: string;

  @ApiProperty({ description: 'Estado', example: 'PENDIENTE' })
  @IsString()
  @IsOptional()
  estado?: string;

  @ApiProperty({
    description: 'Fecha de emision de la derivación',
    example: '2024-02-20T12:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe ser una cadena ISO 8601 válida' })
  fechaEmision?: string;
}
