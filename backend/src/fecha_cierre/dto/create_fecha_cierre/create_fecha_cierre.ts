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

export class CreateFechaCierre {
  @ApiProperty({
    description:
      'Fecha de cierre en formato AAAA-MM-DD. Días festivos o no laborables.',
    example: '2026-02-16',
  })
  @IsDateString()
  @IsNotEmpty()
  readonly fecha: string;
  @ApiProperty({
    description: 'Descripción del motivo del cierre',
    example: 'Primer feriado de carnaval',
  })
  @IsString()
  @IsNotEmpty()
  readonly descripcion: string;
}
