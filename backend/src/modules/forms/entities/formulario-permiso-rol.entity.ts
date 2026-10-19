import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Rol } from '../../users/entities/rol.entity';
import { Formulario } from './formulario.entity';

@Entity('formulario_permisos_rol')
@Unique('UQ_formulario_permiso_rol', ['idFormulario', 'idRol'])
export class FormularioPermisoRol {
  @PrimaryGeneratedColumn({ name: 'id_formulario_permiso' })
  idFormularioPermiso: number;

  @Column({ name: 'id_formulario' })
  idFormulario: number;

  @Column({ name: 'id_rol' })
  idRol: number;

  @Column({ name: 'can_view', default: false })
  canView: boolean;

  @Column({ name: 'can_fill', default: false })
  canFill: boolean;

  @Column({ name: 'can_edit', default: false })
  canEdit: boolean;

  @Column({ name: 'can_delete', default: false })
  canDelete: boolean;

  @ManyToOne(() => Formulario, (formulario) => formulario.permisos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_formulario' })
  formulario: Formulario;

  @ManyToOne(() => Rol, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_rol' })
  rol: Rol;
}
