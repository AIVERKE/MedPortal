import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CuentaRolEstudianteDto {
  @ApiProperty({ example: '202312345' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  registroUniversitario: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idFacultad: number;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idCarrera: number;
}

export class CuentaRolDocenteDto {
  @ApiProperty({ example: 'ITEM-456' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  numeroItem: string;

  @ApiProperty({ example: 'Facultad de Medicina' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  facultad: string;

  @ApiProperty({ example: 'Interino' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  interinoContratado: string;
}

export class CuentaRolAdministrativoDto {
  @ApiProperty({ example: 'ITEM-123' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  numeroItem: string;

  @ApiProperty({ example: 'Recursos Humanos' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  unidad: string;

  @ApiProperty({ example: 'Auxiliar Administrativo' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  cargo: string;
}

export class CuentaRolConsultorDto {
  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  tipoServicio: string;

  @ApiProperty({ example: 'Unidad de Postas' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  unidad: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsNotEmpty()
  @IsDateString()
  fechaInicioContrato: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  fechaFinContrato?: string;

  @ApiProperty({ example: 'Secretario' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  cargo: string;
}
