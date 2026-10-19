import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateEmergenciaDto {
  @ApiProperty({
    example: 1,
    description: 'ID de la entidad Persona (Doctor) relacionada',
  })
  @IsNotEmpty({ message: 'El ID de la persona es obligatorio' })
  @IsInt({ message: 'El ID de la persona debe ser un número entero' })
  idPersona: number;

  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del paciente',
  })
  @IsNotEmpty({ message: 'El nombre del paciente es obligatorio' })
  @IsString({ message: 'El nombre del paciente debe ser una cadena de texto' })
  @MaxLength(255, {
    message: 'El nombre del paciente no puede exceder los 255 caracteres',
  })
  nombrePaciente: string;

  @ApiProperty({
    example: '2024-04-07',
    description: 'Fecha de la atención (YYYY-MM-DD)',
  })
  @IsNotEmpty({ message: 'La fecha de atención es obligatoria' })
  @IsDateString({}, { message: 'La fecha de atención debe ser una fecha válida' })
  fechaAtencion: string;

  @ApiProperty({
    example: '10:30:00',
    description: 'Hora de inicio de la atención (HH:mm:ss)',
  })
  @IsNotEmpty({ message: 'La hora de inicio es obligatoria' })
  @IsString({ message: 'La hora de inicio debe ser una cadena de texto' })
  horaInicio: string;

  @ApiProperty({
    example: '11:15:00',
    description: 'Hora de fin de la atención (HH:mm:ss)',
  })
  @IsNotEmpty({ message: 'La hora de fin es obligatoria' })
  @IsString({ message: 'La hora de fin debe ser una cadena de texto' })
  horaFin: string;

  @ApiProperty({
    example: 'Paciente con dolor abdominal agudo',
    description: 'Descripción detallada del caso',
  })
  @IsNotEmpty({ message: 'La descripción del caso es obligatoria' })
  @IsString({ message: 'La descripción del caso debe ser una cadena de texto' })
  descripcionCaso: string;
}
