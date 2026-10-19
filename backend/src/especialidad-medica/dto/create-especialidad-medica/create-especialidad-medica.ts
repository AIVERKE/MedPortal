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
  IsBoolean,
} from 'class-validator';

export class CreateEspecialidadMedica {
  @ApiProperty({
    description: 'Nombre de la especialidad médica',
    example: 'Cardiología',
  })
  @IsString()
  @IsNotEmpty()
  readonly nombre: string;
  @ApiProperty({
    description: 'Código único de la especialidad médica',
    example: 'CARDIO01',
  })
  @IsString()
  @IsNotEmpty()
  readonly codigo: string;
  @ApiProperty({
    description: 'Descripción de la especialidad médica',
    example:
      'Especialidad dedicada al estudio y tratamiento de enfermedades del corazón y del sistema circulatorio.',
  })
  @IsString()
  @IsNotEmpty()
  readonly descripcion: string;
  @ApiProperty({
    description: 'Tiempo de cita por defecto en minutos',
    example: 30,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(120)
  readonly tiempoCitaPorDefecto: number;
  @ApiProperty({
    description:
      'Indica si la especialidad médica es visible para los pacientes',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  readonly visible: boolean;
  @ApiProperty({
    description: 'Indica si la especialidad médica está activa',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  readonly activo: boolean;
}
