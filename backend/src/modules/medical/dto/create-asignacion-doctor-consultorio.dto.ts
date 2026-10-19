import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMilitaryTime,
} from 'class-validator';

export class CreateAsignacionDoctorConsultorioDto {
  @ApiProperty({ description: 'ID del doctor', example: 1 })
  @IsInt()
  @IsNotEmpty()
  idDoctor: number;

  @ApiProperty({ description: 'ID del consultorio especialidad', example: 1 })
  @IsInt()
  @IsNotEmpty()
  idConsultorio: number;

  @ApiProperty({ description: 'ID de la especialidad medica', example: 1 })
  @IsInt()
  @IsNotEmpty()
  idEspecialidad: number;

  @ApiProperty({
    description: 'Días de la semana',
    example: 'Lunes, Miércoles',
    required: false,
  })
  @IsString()
  @IsOptional()
  diasSemana?: string;

  @ApiProperty({ description: 'Turno', example: 'Mañana', required: false })
  @IsString()
  @IsOptional()
  turno?: string;

  @ApiProperty({
    description: 'Hora de inicio',
    example: '08:00',
    required: false,
  })
  @IsMilitaryTime()
  @IsOptional()
  horaInicio?: string;

  @ApiProperty({
    description: 'Hora de fin',
    example: '12:00',
    required: false,
  })
  @IsMilitaryTime()
  @IsOptional()
  horaFin?: string;

  @ApiProperty({
    description: 'Duración de la cita en minutos',
    example: 20,
    required: false,
  })
  @IsInt()
  @IsOptional()
  duracionCita?: number;

  @ApiProperty({
    description: 'Cupos disponibles',
    example: 15,
    required: false,
  })
  @IsInt()
  @IsOptional()
  cuposDisponibles?: number;

  @ApiProperty({
    description:
      'Override de horas libres mensuales (horas enteras). Si null, se usa el cupo global.',
    example: 8,
    required: false,
    nullable: true,
  })
  @IsInt()
  @IsOptional()
  horasLibresMensuales?: number | null;
}
