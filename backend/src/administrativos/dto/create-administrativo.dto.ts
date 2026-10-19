import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateAdministrativoDto {
  @ApiProperty({
    description: 'ID de la persona (entidad Persona)',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  idPersona: number;

  // --- Administrativo Fields ---
  @ApiPropertyOptional({ description: 'Número de ítem', example: 'ITEM-123' })
  @IsString()
  @IsOptional()
  @Length(1, 50)
  numeroItem?: string;

  @ApiPropertyOptional({ description: 'Unidad a la que pertenece', example: 'Recursos Humanos' })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  unidad?: string;

  @ApiPropertyOptional({ description: 'Cargo que ocupa', example: 'Auxiliar Administrativo' })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  cargo?: string;

  @ApiPropertyOptional({ description: 'Estado laboral', example: 'Permanente' })
  @IsString()
  @IsOptional()
  @Length(1, 50)
  estadoLaboral?: string;
}
