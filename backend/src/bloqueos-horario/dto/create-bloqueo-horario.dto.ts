import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateBloqueoHorarioDto {
  @ApiProperty({ description: 'Fecha del bloqueo (YYYY-MM-DD)', example: '2026-08-25' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fecha debe tener formato YYYY-MM-DD',
  })
  fecha: string;

  @ApiProperty({
    description: 'Hora de inicio del slot (HH:mm o HH:mm:ss)',
    example: '10:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, {
    message: 'horaInicio debe tener formato HH:mm o HH:mm:ss',
  })
  horaInicio: string;

  @ApiProperty({
    description: 'Hora de fin del slot (HH:mm o HH:mm:ss)',
    example: '10:20',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, {
    message: 'horaFin debe tener formato HH:mm o HH:mm:ss',
  })
  horaFin: string;

  @ApiProperty({
    description: 'Descripción opcional del bloqueo',
    example: 'Almuerzo',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string | null;
}
