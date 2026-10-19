import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFacultadDto {
  @ApiProperty({ description: 'Nombre de la facultad', example: 'Facultad de Medicina' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ description: 'Estado activo', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
