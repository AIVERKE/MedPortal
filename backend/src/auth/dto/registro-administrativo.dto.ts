import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { RegistroPersonaBaseDto } from './registro-persona-base.dto';

export class RegistroAdministrativoDto extends RegistroPersonaBaseDto {
  @ApiPropertyOptional({ description: 'Número de ítem', example: 'ITEM-123' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  numeroItem?: string;

  @ApiPropertyOptional({ description: 'Unidad a la que pertenece', example: 'Recursos Humanos' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  unidad?: string;

  @ApiPropertyOptional({ description: 'Cargo que ocupa', example: 'Auxiliar Administrativo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cargo?: string;
}
