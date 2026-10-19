import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { ConsultorioEspecialidad } from './consultorio-especialidad.entity';
import { ReservaPaciente } from '../../appointments/entities/reserva-paciente.entity';

@Entity('postas_medicas')
export class PostaMedica {
  @PrimaryGeneratedColumn({ name: 'id_posta' })
  idPosta: number;

  @Column({ name: 'nombre', length: 100 })
  nombre: string;

  @Column({ name: 'codigo', length: 50, nullable: true })
  codigo: string;

  @Column({ name: 'direccion', type: 'text', nullable: true })
  direccion: string;

  @Column({ name: 'telefono', length: 20, nullable: true })
  telefono: string;

  @Column({ name: 'ubicacion_gps', length: 100, nullable: true })
  ubicacionGps: string;

  @Column({
    name: 'horario_atencion_manana_inicio',
    type: 'time',
    nullable: true,
  })
  horarioAtencionMananaInicio: string;

  @Column({ name: 'horario_atencion_manana_fin', type: 'time', nullable: true })
  horarioAtencionMananaFin: string;

  @Column({
    name: 'horario_atencion_tarde_inicio',
    type: 'time',
    nullable: true,
  })
  horarioAtencionTardeInicio: string;

  @Column({ name: 'horario_atencion_tarde_fin', type: 'time', nullable: true })
  horarioAtencionTardeFin: string;

  @Column({ name: 'activo', default: true })
  activo: boolean;

  @OneToMany(() => ConsultorioEspecialidad, (consultorio) => consultorio.posta)
  consultorios: ConsultorioEspecialidad[];

  @OneToMany(() => ReservaPaciente, (reserva) => reserva.posta)
  reservas: ReservaPaciente[];

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
