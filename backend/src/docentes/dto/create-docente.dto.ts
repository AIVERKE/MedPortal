import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDocenteDto {
    @ApiProperty({
        description: 'ID de la persona (entidad Persona)',
        example: 1,
    })
    @IsNotEmpty()
    @IsInt()
    idPersona: number;

    @ApiProperty({
        description: 'Número de ítem del docente',
        required: false,
        example: 'ITEM-456',
    })
    @IsOptional()
    @IsString()
    numeroItem?: string;

    @ApiProperty({
        description: 'Facultad del docente',
        required: false,
        example: 'Facultad de Medicina',
    })
    @IsOptional()
    @IsString()
    facultad?: string;

    @ApiProperty({
        description: 'Tipo de contrato (Interino/Contratado)',
        required: false,
        example: 'Interino',
    })
    @IsOptional()
    @IsString()
    interinoContratado?: string;

    @ApiProperty({
        description: 'Estado activo del docente',
        required: false,
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
