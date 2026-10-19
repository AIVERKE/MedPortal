import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservaPacienteDto {
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

  @ApiProperty({ description: 'ID del doctor', example: 5 })
  @IsNotEmpty()
  @IsInt()
  idDoctor: number;

  @ApiProperty({ description: 'Fecha de la cita', example: '2024-10-25' })
  @IsNotEmpty()
  @IsDateString()
  fechaCita: string;

  @ApiProperty({
    description: 'Hora de inicio de la cita',
    example: '10:00:00',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'horaInicioCita must be a valid time (HH:mm or HH:mm:ss)',
  })
  horaInicioCita: string;

  @ApiProperty({ description: 'Hora de fin de la cita', example: '10:30:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'horaFinCita must be a valid time (HH:mm or HH:mm:ss)',
  })
  horaFinCita: string;

  @ApiProperty({
    description: 'Motivo de cancelación (opcional)',
    required: false,
    example: 'Emergencia personal',
  })
  @IsOptional()
  @IsString()
  motivoCancelacion?: string;

  @ApiProperty({
    description: 'Observaciones adicionales (opcional)',
    required: false,
    example: 'Primera consulta',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
