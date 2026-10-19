import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Usuario o cédula de identidad para iniciar sesión',
    example: 'usuario123',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Contraseña para iniciar sesión',
    example: 'contraseña123',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'ID de rol seleccionado (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  idRol?: number;
}
