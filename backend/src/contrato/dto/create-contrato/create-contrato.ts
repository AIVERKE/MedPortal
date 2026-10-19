import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class CreateContrato {
  @ApiProperty({
    description: 'ID del consultor',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  readonly idConsultor: number;

  @ApiProperty({
    description: 'ID del servicio',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  readonly idServicio: number;

  @ApiProperty({
    description: 'Nombre de la Unidad a la que pertenece',
    example: 'Unidad 1',
  })
  @IsString()
  @IsNotEmpty()
  readonly unidad: string;

  @ApiProperty({
    description: 'Fecha de inicio del contrato en formato AAAA-MM-DD',
    example: '2023-01-01',
  })
  @IsDateString()
  @IsNotEmpty()
  readonly fechaInicioContrato: string;

  @ApiProperty({
    description: 'Fecha fin del contrato en formato AAAA-MM-DD',
    example: '2023-12-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  readonly fechaFinContrato?: string;

  @ApiProperty({
    description: 'Cargo del consultor',
    example: 'Secretario',
  })
  @IsString()
  @IsNotEmpty()
  readonly cargo: string;

  @ApiPropertyOptional({
    description: 'URL del documento del contrato (opcional si se sube PDF)',
  })
  @IsOptional()
  @IsString()
  readonly documentoContratoUrl?: string;
}
