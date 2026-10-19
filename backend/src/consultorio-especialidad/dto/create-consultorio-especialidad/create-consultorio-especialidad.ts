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

export class CreateConsultorioEspecialidad {
  @ApiProperty({
    example: 1,
    description: 'Identificador único de la posta médica',
    required: true,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly idPosta: number;
  @ApiProperty({
    example: 1,
    description: 'Identificador único de la especialidad médica',
    required: true,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly idEspecialidad: number;
  @ApiProperty({
    example: '2024-12-31',
    description:
      'Fecha de habilitación del consultorio especialidad en formato AAAA-MM-DD',
    required: true,
    type: Date,
  })
  @IsNotEmpty()
  @IsDateString()
  readonly fechaHabilitacion: string;
  @ApiProperty({
    example: 'C-101',
    description: 'Número del consultorio',
    required: true,
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly numeroConsultorio: string;
  @ApiProperty({
    example: 'Primer piso, al fondo del pasillo junto a enfermería',
    description: 'Descripción de la ubicación / cómo llegar al consultorio',
    required: true,
    type: String,
  })
  @IsNotEmpty({ message: 'El piso / ubicación es obligatorio' })
  @IsString()
  readonly pisoUbicacion: string;
  @ApiProperty({
    example: true,
    description: 'Estado del consultorio especialidad',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  readonly activo?: boolean;
}
