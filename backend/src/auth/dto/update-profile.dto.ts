import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Juan' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  nombres: string;

  @ApiProperty({ example: 'Pérez' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  primerApellido: string;

  @ApiProperty({ example: 'Gómez', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  segundoApellido?: string;

  @ApiProperty({ example: 'Masculino', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  genero?: string;

  @ApiProperty({ example: '71234567', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  celular?: string;

  @ApiProperty({ example: 'juan.perez@example.com', required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiProperty({ example: 'Av. Siempre Viva #123', required: false })
  @IsOptional()
  @IsString()
  direccion?: string;
}
