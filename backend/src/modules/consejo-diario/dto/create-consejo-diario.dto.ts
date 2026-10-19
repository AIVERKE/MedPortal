import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConsejoDiarioDto {
  @ApiProperty({
    description: 'Título del consejo de salud diario',
    example: 'Hidratación Diaria',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titulo: string;

  @ApiProperty({
    description: 'Contenido detallado del consejo',
    example:
      'Beber al menos 2 litros de agua al día para mantenerte hidratado.',
  })
  @IsString()
  @IsNotEmpty()
  contenido: string;

  @ApiPropertyOptional({
    description: 'Categoría del consejo',
    example: 'Nutrición',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  categoria?: string;

  @ApiPropertyOptional({
    description: 'Fecha programada de publicación',
    example: '2024-12-25',
  })
  @IsDateString()
  @IsOptional()
  fechaPublicacion?: Date;
}
