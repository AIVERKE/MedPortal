import { IsDateString, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReagendarReservaDto {
  @ApiProperty({ description: 'Nueva fecha de la cita', example: '2024-10-25' })
  @IsNotEmpty()
  @IsDateString()
  fechaCita: string;

  @ApiProperty({
    description: 'Nueva hora de inicio de la cita',
    example: '10:00:00',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'horaInicioCita must be a valid time (HH:mm or HH:mm:ss)',
  })
  horaInicioCita: string;

  @ApiProperty({
    description: 'Nueva hora de fin de la cita',
    example: '10:30:00',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'horaFinCita must be a valid time (HH:mm or HH:mm:ss)',
  })
  horaFinCita: string;

  @ApiPropertyOptional({
    description: 'Mensaje opcional que explica la reagendación',
    example: 'Se adelanta la consulta por un espacio libre.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  motivo?: string;
}
