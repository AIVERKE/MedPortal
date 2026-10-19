import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioDto {
    @ApiProperty({ description: 'ID de la persona vinculada' })
    @IsNumber()
    @IsNotEmpty()
    idPersona: number;

    @ApiProperty({ description: 'Nombre de usuario' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ description: 'Contraseña del usuario', minLength: 6 })
    @IsString()
    @IsNotEmpty()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    password: string;

    @ApiProperty({ description: 'Indica si el usuario es de tipo libro', default: false })
    @IsBoolean()
    @IsOptional()
    is_book?: boolean;
}
