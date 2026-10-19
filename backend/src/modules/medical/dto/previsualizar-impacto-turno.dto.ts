import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PrevisualizarImpactoTurnoDto {
  @ApiPropertyOptional({ example: '08:30:00' })
  @IsOptional()
  @IsString()
  horaInicio?: string;

  @ApiPropertyOptional({ example: '12:30:00' })
  @IsOptional()
  @IsString()
  horaFin?: string;

  @ApiPropertyOptional({
    description: 'Días de la semana separados por coma',
    example: 'LUNES, MARTES, MIERCOLES',
  })
  @IsOptional()
  @IsString()
  diasSemana?: string;
}
