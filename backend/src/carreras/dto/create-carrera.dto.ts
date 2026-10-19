import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCarreraDto {
  @ApiProperty({ description: 'Nombre de la carrera', example: 'Medicina' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ description: 'ID de la facultad', example: 1 })
  @IsInt()
  idFacultad: number;

  @ApiProperty({ description: 'Estado activo', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
