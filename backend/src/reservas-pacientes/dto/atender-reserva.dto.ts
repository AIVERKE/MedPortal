import {
  IsDateString,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AtenderReservaDto {
  @ApiProperty({
    description: 'Fecha en la que el paciente fue atendido (YYYY-MM-DD)',
    example: '2024-10-25',
  })
  @IsNotEmpty()
  @IsDateString()
  fechaAtendido: string;

  @ApiProperty({
    description: 'Hora en la que el paciente fue atendido (HH:mm:ss o HH:mm)',
    example: '10:15:00',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'horaAtendido must be a valid time (HH:mm or HH:mm:ss)',
  })
  horaAtendido: string;
}
