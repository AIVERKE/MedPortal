import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDoctorDto {
  @ApiProperty({
    description: 'ID de la persona (entidad Persona)',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  idPersona: number;

  @ApiProperty({ description: 'ID de la especialidad médica', example: 1 })
  @IsNotEmpty()
  @IsInt()
  idEspecialidadMedica: number;

  @ApiProperty({
    description: 'Matrícula profesional del doctor',
    required: false,
    example: 'MED-12345',
  })
  @IsOptional()
  @IsString()
  matriculaProfesional?: string;

  @ApiProperty({
    description: 'Experiencia profesional (texto descriptivo)',
    required: false,
    example: '5 años de experiencia en el hospital general.',
  })
  @IsOptional()
  @IsString()
  experienciaProfesional?: string;

  @ApiProperty({
    description: 'Universidad de origen',
    required: false,
    example: 'Universidad Mayor de San Andrés',
  })
  @IsOptional()
  @IsString()
  universidadOrigen?: string;

  @ApiProperty({
    description: 'Título profesional',
    required: false,
    example: 'Médico Cirujano',
  })
  @IsOptional()
  @IsString()
  tituloProfesional?: string;

  @ApiProperty({
    description: 'Teléfono de emergencia del doctor',
    required: false,
    example: '71234567',
  })
  @IsOptional()
  @IsString()
  telefonoEmergencia?: string;

  @ApiProperty({
    description:
      'Si es true, los pacientes ven el teléfono de emergencia al reservar',
    required: false,
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  compartirTelefonoEmergencia?: boolean;

  // Campos de Persona (Opcionales para actualización/creación simultánea)
  @ApiProperty({ description: 'Nombres de la persona', required: false, example: 'Henry' })
  @IsOptional()
  @IsString()
  nombres?: string;

  @ApiProperty({ description: 'Primer apellido', required: false, example: 'Director' })
  @IsOptional()
  @IsString()
  primerApellido?: string;

  @ApiProperty({ description: 'Segundo apellido', required: false, example: 'Test' })
  @IsOptional()
  @IsString()
  segundoApellido?: string;

  @ApiProperty({ description: 'Cédula de Identidad', required: false, example: '1234567' })
  @IsOptional()
  @IsString()
  ci?: string;

  @ApiProperty({ description: 'Teléfono celular', required: false, example: '71234567' })
  @IsOptional()
  @IsString()
  celular?: string;

  @ApiProperty({ description: 'Correo electrónico', required: false, example: 'henry@test.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Género', required: false, example: 'M' })
  @IsOptional()
  @IsString()
  genero?: string;

  @ApiProperty({ description: 'Dirección de domicilio', required: false, example: 'Calle Falsa 123' })
  @IsOptional()
  @IsString()
  direccion?: string;
}
