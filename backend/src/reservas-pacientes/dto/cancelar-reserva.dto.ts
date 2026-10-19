import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelarReservaDto {
  @ApiPropertyOptional({
    description: 'Mensaje opcional de quien cancela la cita',
    example: 'No podré asistir por un compromiso.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  motivo?: string;
}
