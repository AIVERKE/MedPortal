import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { PostaMedica } from './posta-medica.entity';
import { AsignacionDoctorConsultorio } from './asignacion-doctor-consultorio.entity';
import { EspecialidadMedica } from './especialidad-medica.entity';

@Entity('consultorios_especialidad')
export class ConsultorioEspecialidad {
  @PrimaryGeneratedColumn({ name: 'id_consultorio' })
  idConsultorio: number;

  @ManyToOne(() => PostaMedica, (posta) => posta.consultorios)
  @JoinColumn({ name: 'id_posta' })
  posta: PostaMedica;

  @ManyToOne(
    () => EspecialidadMedica,
    (especialidad) => especialidad.consultorios,
  )
  @JoinColumn({ name: 'id_especialidad' })
  especialidad: EspecialidadMedica;

  @Column({ name: 'fecha_habilitacion', type: 'date', nullable: true })
  fechaHabilitacion: Date;

  @Column({ name: 'numero_consultorio', length: 20, nullable: true })
  numeroConsultorio: string;

  @Column({ name: 'piso_ubicacion', type: 'text', nullable: true })
  pisoUbicacion: string;

  @Column({ name: 'activo', default: true })
  activo: boolean;

  @OneToMany(() => AsignacionDoctorConsultorio, (asig) => asig.consultorio)
  asignaciones: AsignacionDoctorConsultorio[];

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
