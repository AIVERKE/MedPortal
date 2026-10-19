import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../users/entities/usuario.entity';
import type { FormularioDefinicion } from './formulario.entity';
import { FormularioInstancia } from './formulario-instancia.entity';

@Entity('formulario_instancia_versiones')
export class FormularioInstanciaVersion {
  @PrimaryGeneratedColumn({ name: 'id_version' })
  idVersion: number;

  @Column({ name: 'id_instancia' })
  idInstancia: number;

  @Column({ name: 'editado_por_id_usuario' })
  editadoPorIdUsuario: number;

  @Column({ name: 'respuestas', type: 'jsonb', default: () => `'{}'` })
  respuestas: Record<string, unknown>;

  @Column({ name: 'definicion_snapshot', type: 'jsonb' })
  definicionSnapshot: FormularioDefinicion;

  @ManyToOne(() => FormularioInstancia, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_instancia' })
  instancia: FormularioInstancia;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'editado_por_id_usuario' })
  editadoPor: Usuario;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
