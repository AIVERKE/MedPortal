import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDateString,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConsultaSinReservaDto {
  @ApiProperty({ description: 'ID del usuario (paciente)', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  idUsuario: number;

  @ApiProperty({ description: 'ID de la especialidad médica', example: 2 })
  @IsNotEmpty()
  @IsNumber()
  idEspecialidad: number;

  @ApiProperty({ description: 'ID de la posta médica', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  idPosta: number;

  @ApiProperty({ description: 'ID de la persona (Doctor)', example: 5 })
  @IsNotEmpty()
  @IsInt()
  idPersona: number;

  @ApiProperty({
    description: 'Fecha en la que el paciente es atendido',
    example: '2024-10-25',
  })
  @IsNotEmpty({ message: 'La fecha de atención es obligatoria' })
  @IsDateString({}, { message: 'La fecha de atención debe ser una fecha válida' })
  fechaAtendido: Date;

  @ApiProperty({
    description: 'Hora de inicio de la atención',
    example: '10:15:00',
  })
  @IsNotEmpty({ message: 'La hora de inicio es obligatoria' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'horaAtendido must be a valid time (HH:mm or HH:mm:ss)',
  })
  horaAtendido: string;

  @ApiProperty({
    description: 'Hora de fin de la atención',
    example: '10:45:00',
  })
  @IsNotEmpty({ message: 'La hora de fin es obligatoria' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'horaFinCita must be a valid time (HH:mm or HH:mm:ss)',
  })
  horaFinCita: string;

  @ApiProperty({
    description: 'Observaciones de la atención',
    example: 'Consulta espontánea (walk-in)',
  })
  @IsNotEmpty({ message: 'Las observaciones son obligatorias' })
  @IsString()
  observaciones: string;
}
