import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Persona } from '../../users/entities/persona.entity';
import { Usuario } from '../../users/entities/usuario.entity';
import { FormularioPermisoRol } from './formulario-permiso-rol.entity';

export type FormularioCategoria = 'historial' | 'encuesta' | 'operativo';
export type FormularioEstado = 'borrador' | 'publicado';
export type FormularioFillMode = 'single' | 'limited' | 'unlimited';
export type FormularioVisibilidadInstancias = 'publico' | 'privado';

export interface FormularioDefinicion {
  sections: Array<{
    id: string;
    title: string;
    description?: string;
    fields: Array<{
      id: string;
      label: string;
      type: string;
      required?: boolean;
      options?: string[];
      helpText?: string;
      minLength?: number | null;
      maxLength?: number | null;
    }>;
  }>;
}

@Entity('formularios')
export class Formulario {
  @PrimaryGeneratedColumn({ name: 'id_formulario' })
  idFormulario: number;

  @Column({ name: 'titulo', type: 'varchar', length: 255, default: 'Formulario sin título' })
  titulo: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'categoria', type: 'varchar', length: 50, nullable: true })
  categoria: FormularioCategoria | null;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'borrador' })
  estado: FormularioEstado;

  @Column({ name: 'fill_mode', type: 'varchar', length: 20, default: 'single' })
  fillMode: FormularioFillMode;

  @Column({ name: 'fill_limit', type: 'int', nullable: true })
  fillLimit: number | null;

  @Column({
    name: 'visibilidad_instancias',
    type: 'varchar',
    length: 20,
    default: 'publico',
  })
  visibilidadInstancias: FormularioVisibilidadInstancias;

  @Column({
    name: 'definicion_borrador',
    type: 'jsonb',
    default: () => `'{"sections":[]}'`,
  })
  definicionBorrador: FormularioDefinicion;

  @Column({ name: 'definicion_publicada', type: 'jsonb', nullable: true })
  definicionPublicada: FormularioDefinicion | null;

  @Column({ name: 'publicado_en', type: 'timestamptz', nullable: true })
  publicadoEn: Date | null;

  @Column({ name: 'guardado_en', type: 'timestamptz', nullable: true })
  guardadoEn: Date | null;

  @Column({ name: 'creado_por_id_persona', type: 'int', nullable: true })
  creadoPorIdPersona: number | null;

  @Column({ name: 'ultimo_guardado_por_id_usuario', type: 'int', nullable: true })
  ultimoGuardadoPorIdUsuario: number | null;

  @Column({ name: 'ultimo_publicado_por_id_usuario', type: 'int', nullable: true })
  ultimoPublicadoPorIdUsuario: number | null;

  @ManyToOne(() => Persona, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'creado_por_id_persona' })
  creadoPor: Persona | null;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ultimo_guardado_por_id_usuario' })
  ultimoGuardadoPor: Usuario | null;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ultimo_publicado_por_id_usuario' })
  ultimoPublicadoPor: Usuario | null;

  @OneToMany(() => FormularioPermisoRol, (permiso) => permiso.formulario, {
    cascade: true,
  })
  permisos: FormularioPermisoRol[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
