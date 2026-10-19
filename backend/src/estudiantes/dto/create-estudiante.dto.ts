import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEstudianteDto {
    @ApiProperty({
        description: 'ID de la persona (entidad Persona)',
        example: 1,
    })
    @IsNotEmpty()
    @IsInt()
    idPersona: number;

    @ApiProperty({
        description: 'Registro universitario del estudiante',
        required: false,
        example: '201500123',
    })
    @IsOptional()
    @IsString()
    registroUniversitario?: string;

    @ApiProperty({
        description: 'Carrera del estudiante',
        required: false,
        example: 'Medicina',
    })
    @IsOptional()
    @IsString()
    carrera?: string;

    @ApiProperty({
        description: 'Facultad del estudiante',
        required: false,
        example: 'Facultad de Medicina',
    })
    @IsOptional()
    @IsString()
    facultad?: string;

    @ApiProperty({
        description: 'ID de la facultad en catálogo',
        required: false,
        example: 1,
    })
    @IsOptional()
    @IsInt()
    idFacultad?: number;

    @ApiProperty({
        description: 'ID de la carrera en catálogo',
        required: false,
        example: 3,
    })
    @IsOptional()
    @IsInt()
    idCarrera?: number;

    @ApiProperty({
        description: 'URL del PDF de matrícula',
        required: false,
        example: '/uploads/registros/matricula_123.pdf',
    })
    @IsOptional()
    @IsString()
    documentoMatriculaUrl?: string;

    @ApiProperty({
        description: 'URL del PDF de carnet de identidad',
        required: false,
        example: '/uploads/registros/carnet_123.pdf',
    })
    @IsOptional()
    @IsString()
    documentoCarnetUrl?: string;

    @ApiProperty({
        description: 'Estado académico del estudiante',
        required: false,
        example: 'Regular',
    })
    @IsOptional()
    @IsString()
    estadoAcademico?: string;

    @ApiProperty({
        description: 'Estado activo del estudiante',
        required: false,
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
