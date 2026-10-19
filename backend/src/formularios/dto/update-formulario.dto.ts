import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class FormularioPermisoRolDto {
  @IsInt()
  idRol: number;

  @IsBoolean()
  canView: boolean;

  @IsBoolean()
  canFill: boolean;

  @IsBoolean()
  canEdit: boolean;

  @IsBoolean()
  canDelete: boolean;
}

export class UpdateFormularioDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsIn(['historial', 'encuesta', 'operativo'])
  categoria?: 'historial' | 'encuesta' | 'operativo' | null;

  @IsOptional()
  @IsIn(['single', 'limited', 'unlimited'])
  fillMode?: 'single' | 'limited' | 'unlimited';

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  fillLimit?: number | null;

  @IsOptional()
  @IsIn(['publico', 'privado'])
  visibilidadInstancias?: 'publico' | 'privado';

  @IsOptional()
  @IsObject()
  definicionBorrador?: {
    sections: Array<{
      id: string;
      title: string;
      description?: string;
      fields: Array<Record<string, unknown>>;
    }>;
  };

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormularioPermisoRolDto)
  permisos?: FormularioPermisoRolDto[];
}

export class CreateFormularioInstanciaDto {
  @IsOptional()
  @IsObject()
  respuestas?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  paraQuienIdUsuario?: number;

  @IsOptional()
  @IsIn(['guardado', 'enviado', 'borrador'])
  estado?: 'guardado' | 'enviado' | 'borrador';
}

export class UpdateFormularioInstanciaDto {
  @IsOptional()
  @IsObject()
  respuestas?: Record<string, unknown>;

  @IsOptional()
  @IsIn(['guardado', 'enviado', 'borrador'])
  estado?: 'guardado' | 'enviado' | 'borrador';
}

export class EditDraftDto {
  @IsOptional()
  @IsObject()
  respuestas?: Record<string, unknown>;
}

export class CommitEditDto {
  @IsOptional()
  @IsObject()
  respuestas?: Record<string, unknown>;
}
