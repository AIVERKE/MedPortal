import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Matches,
  Max,
  Validate,
  IsOptional,
} from 'class-validator';
import { IsTimeRangeValid } from '../../../../time-range.validator';

export class CreateConfiguration {
  @ApiProperty({
    description: 'Días de la semana en los que se permiten reservas',
    example: 'Lunes, Martes, Miércoles',
  })
  @IsString()
  @IsNotEmpty()
  readonly diasSemana: string;

  @ApiProperty({
    description: 'Hora de inicio para permitir reservas',
    example: '08:00:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'La hora debe tener el formato HH:mm:ss (ejemplo: 08:00:00)',
  })
  readonly horaInicioReserva: string;

  @ApiProperty({
    description: 'Hora de fin para permitir reservas',
    example: '18:00:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'La hora debe tener el formato HH:mm:ss (ejemplo: 08:00:00)',
  })
  @IsTimeRangeValid('horaInicioReserva', {
    message: 'La hora de fin debe ser posterior a la hora de inicio.',
  })
  readonly horaFinReserva: string;

  @ApiProperty({
    description: 'Días mínimos de anticipación para realizar una reserva',
    example: 2,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Validate(
    (o: CreateConfiguration) =>
      o.diasAnticipacionMinima <= o.diasAnticipacionMaxima,
    {
      message: 'La anticipación mínima no puede ser mayor a la máxima.',
    },
  )
  readonly diasAnticipacionMinima: number;

  @ApiProperty({
    description: 'Días máximos de anticipación para realizar una reserva',
    example: 30,
  })
  @IsNotEmpty()
  @IsInt()
  @Max(30)
  readonly diasAnticipacionMaxima: number;

  @ApiProperty({
    description:
      'Horas libres mensuales globales para bloqueos de horario del doctor (horas enteras)',
    example: 8,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly horasLibresMensuales?: number | null;
}
