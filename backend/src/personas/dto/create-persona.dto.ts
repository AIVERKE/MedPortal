import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePersonaDto {
  @ApiProperty({ description: 'Cédula de identidad', example: '1234567' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  ci: string;

  @ApiProperty({ description: 'Nombres de la persona', example: 'Juan' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  nombres: string;

  @ApiProperty({ description: 'Primer apellido', example: 'Pérez' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  primerApellido: string;

  @ApiProperty({
    description: 'Segundo apellido',
    example: 'Gómez',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  segundoApellido?: string;

  @ApiProperty({
    description: 'Fecha de nacimiento',
    example: '1990-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  fechaNacimiento?: Date;

  @ApiProperty({ description: 'Género', example: 'Masculino', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  genero?: string;

  @ApiProperty({
    description: 'Número de celular',
    example: '71234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  celular?: string;

  @ApiProperty({
    description: 'Correo electrónico',
    example: 'juan.perez@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiProperty({
    description: 'Dirección de domicilio',
    example: 'Av. Siempre Viva #123',
    required: false,
  })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiProperty({
    description: 'URL o path de la foto',
    example: '/uploads/foto.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  foto?: string;

  @ApiProperty({
    description: 'Estado activo',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
