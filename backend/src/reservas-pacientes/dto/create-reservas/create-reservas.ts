import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
  Matches,
  Max,
} from 'class-validator';

export class CreateReservas {
  @ApiProperty({
    example: 1,
    description: 'Identificador único del usuario',
    required: true,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly usuario: number;

  @ApiProperty({
    example: 1,
    description: 'Identificador único de la especialidad médica',
    required: true,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly especialidad: number;

  @ApiProperty({
    example: 1,
    description: 'Identificador único de la posta médica',
    required: true,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly posta: number;

  @ApiProperty({
    example: '2024-12-31',
    description: 'Fecha de la cita en formato AAAA-MM-DD',
    required: true,
    type: Date,
  })
  @IsNotEmpty()
  @IsDateString()
  readonly fechaCita: string;

  @ApiProperty({
    example: '10:00:00',
    description: 'Hora de inicio de la cita en formato HH:MM:SS',
    required: true,
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly horaInicioCita: string;

  @ApiProperty({
    example: '12:00:00',
    description: 'Hora de fin de la cita en formato HH:MM:SS',
    required: true,
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly horaFinCita: string;

  @ApiProperty({
    example: '2024-12-31',
    description: 'Fecha de solicitud de la cita en formato AAAA-MM-DD',
    required: false,
    type: Date,
  })
  @IsOptional()
  @IsDateString()
  readonly fechaSolicitud: string;

  @ApiProperty({
    example: '2024-12-31',
    description: 'Fecja de cancelación de la cita en formato AAAA-MM-DD',
    required: false,
    type: Date,
  })
  @IsOptional()
  @IsDateString()
  readonly fechaCancelacionCita: string;

  @ApiProperty({
    example: 'Motivo de cancelación',
    description: 'Motivo de cancelación de la cita',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly motivoCancelacion: string;

  @ApiProperty({
    example: 'Observaciones adicionales',
    description: 'Observaciones adicionales de la cita',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly observaciones: string;

  @ApiProperty({
    example: 'PENDIENTE',
    description: 'Estado de la reserva',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly estado: string;

  @ApiProperty({
    example: 1,
    description: 'Identificador único de la consulta médica',
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly consulta: number;
}
