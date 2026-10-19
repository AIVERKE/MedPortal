import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateConsultorDto {
    @ApiProperty({
        description: 'ID de la persona (entidad Persona)',
        example: 1,
    })
    @IsNotEmpty()
    @IsInt()
    idPersona: number;
}
