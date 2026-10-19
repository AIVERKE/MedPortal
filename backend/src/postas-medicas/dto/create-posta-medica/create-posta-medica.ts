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

export class CreatePostaMedica {
  @ApiProperty({
    description: 'Nombre de la posta médica',
    example: 'Posta Médica Central',
  })
  @IsString()
  @IsNotEmpty()
  readonly nombre: string;
  @ApiProperty({
    description: 'Código identificador de la posta médica',
    example: 'PMC-001',
  })
  @IsString()
  @IsNotEmpty()
  readonly codigo: string;
  @ApiProperty({
    description: 'Dirección física de la posta médica',
    example: 'Calle Falsa 123, Ciudad',
  })
  @IsString()
  @IsNotEmpty()
  readonly direccion: string;
  @ApiProperty({
    description: 'Número de teléfono de contacto de la posta médica',
    example: '+591 12345678',
  })
  @IsString()
  @IsNotEmpty()
  readonly telefono: string;
  @ApiProperty({
    description: 'Ubicación GPS de la posta médica',
    example: '-16.500000, -68.150000',
  })
  @IsString()
  @IsNotEmpty()
  readonly ubicacionGps: string;
  @ApiProperty({
    description: 'Horario de atención en la mañana - inicio (formato HH:MM:SS)',
    example: '08:00:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'La hora debe tener el formato HH:mm:ss (ejemplo: 08:00:00)',
  })
  readonly horarioAtencionMananaInicio: string;
  @ApiProperty({
    description: 'Horario de atención en la mañana - fin (formato HH:MM:SS)',
    example: '12:00:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'La hora debe tener el formato HH:mm:ss (ejemplo: 08:00:00)',
  })
  readonly horarioAtencionMananaFin: string;
  @ApiProperty({
    description: 'Horario de atención en la tarde - inicio (formato HH:MM:SS)',
    example: '14:00:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'La hora debe tener el formato HH:mm:ss (ejemplo: 08:00:00)',
  })
  readonly horarioAtencionTardeInicio: string;
  @ApiProperty({
    description: 'Horario de atención en la tarde - fin (formato HH:MM:SS)',
    example: '18:00:00',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'La hora debe tener el formato HH:mm:ss (ejemplo: 08:00:00)',
  })
  readonly horarioAtencionTardeFin: string;
  @ApiProperty({
    description: 'Indica si la posta médica está activa',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  readonly activo: boolean;
}
