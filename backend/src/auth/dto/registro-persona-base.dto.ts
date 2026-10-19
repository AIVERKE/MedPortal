import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegistroPersonaBaseDto {
  @ApiProperty({ example: '1234567' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  ci: string;

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

  @ApiProperty({ example: 'Gómez' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  segundoApellido: string;

  @ApiProperty({ example: '1980-03-18' })
  @IsNotEmpty()
  @IsDateString()
  fechaNacimiento: string;

  @ApiProperty({ example: 'F' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  genero: string;

  @ApiProperty({ example: '71234567' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  celular: string;

  @ApiProperty({ example: 'juan.perez@umsa.bo' })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(100)
  email: string;

  @ApiProperty({ example: 'Av. 6 de Agosto #1234' })
  @IsNotEmpty()
  @IsString()
  direccion: string;

  @ApiProperty({ example: 'Password123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password: string;

  @ApiProperty({ example: 'Password123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  confirmPassword: string;

  @ApiProperty({ example: 'ABCD2' })
  @IsNotEmpty()
  @IsString()
  captchaInput: string;

  @ApiProperty({ example: 'eyJhbGciOi...' })
  @IsNotEmpty()
  @IsString()
  captchaToken: string;
}
