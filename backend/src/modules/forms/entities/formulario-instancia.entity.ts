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
import { Usuario } from '../../users/entities/usuario.entity';
import { Formulario } from './formulario.entity';
import type { FormularioDefinicion } from './formulario.entity';
import { FormularioInstanciaVersion } from './formulario-instancia-version.entity';

export type FormularioInstanciaEstado = 'guardado' | 'enviado';

@Entity('formulario_instancias')
export class FormularioInstancia {
  @PrimaryGeneratedColumn({ name: 'id_instancia' })
  idInstancia: number;

  @Column({ name: 'id_formulario' })
  idFormulario: number;

  @Column({ name: 'quien_lleno_id_usuario' })
  quienLlenoIdUsuario: number;

  @Column({ name: 'para_quien_id_usuario' })
  paraQuienIdUsuario: number;

  @Column({ name: 'respuestas', type: 'jsonb', default: () => `'{}'` })
  respuestas: Record<string, unknown>;

  @Column({ name: 'definicion_snapshot', type: 'jsonb' })
  definicionSnapshot: FormularioDefinicion;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'enviado' })
  estado: FormularioInstanciaEstado;

  @Column({ name: 'borrador_edicion_respuestas', type: 'jsonb', nullable: true })
  borradorEdicionRespuestas: Record<string, unknown> | null;

  @Column({ name: 'borrador_edicion_definicion', type: 'jsonb', nullable: true })
  borradorEdicionDefinicion: FormularioDefinicion | null;

  @Column({ name: 'borrador_edicion_por_id_usuario', type: 'int', nullable: true })
  borradorEdicionPorIdUsuario: number | null;

  @Column({ name: 'borrador_edicion_en', type: 'timestamptz', nullable: true })
  borradorEdicionEn: Date | null;

  @ManyToOne(() => Formulario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_formulario' })
  formulario: Formulario;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'quien_lleno_id_usuario' })
  quienLleno: Usuario;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'para_quien_id_usuario' })
  paraQuien: Usuario;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'borrador_edicion_por_id_usuario' })
  borradorEdicionPor: Usuario | null;

  @OneToMany(() => FormularioInstanciaVersion, (v) => v.instancia)
  versiones: FormularioInstanciaVersion[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
