import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Persona } from './persona.entity';
import { Rol } from './rol.entity';

@Entity('asignacion_roles')
export class AsignacionRol {
  @PrimaryGeneratedColumn({ name: 'id_asignacion_rol' })
  idAsignacionRol: number;

  @ManyToOne(() => Persona, (persona) => persona.asignacionesRoles)
  @JoinColumn({ name: 'id_persona' })
  persona: Persona;

  @ManyToOne(() => Rol)
  @JoinColumn({ name: 'id_rol' })
  rol: Rol;

  @Column({
    name: 'fecha_asignacion',
    type: 'date',
    default: () => 'CURRENT_DATE',
  })
  fechaAsignacion: Date;

  @Column({ name: 'activo', default: true })
  activo: boolean;
}
