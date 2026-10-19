import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { ConsultorioEspecialidad } from './consultorio-especialidad.entity';
import { Doctor } from './doctor.entity';
import { AsignacionDoctorConsultorio } from './asignacion-doctor-consultorio.entity';
import { ReservaPaciente } from '../../appointments/entities/reserva-paciente.entity';

@Entity('especialidades_medicas')
export class EspecialidadMedica {
  @PrimaryGeneratedColumn({ name: 'id_especialidad_medica' })
  idEspecialidadMedica: number;

  @Column({ name: 'nombre', length: 100 })
  nombre: string;

  @Column({ name: 'codigo', length: 50, nullable: true })
  codigo: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'tiempo_cita_por_defecto', type: 'int', nullable: true })
  tiempoCitaPorDefecto: number;

  @Column({ name: 'visible', default: true })
  visible: boolean;

  @Column({ name: 'activo', default: true })
  activo: boolean;

  @OneToMany(
    () => ConsultorioEspecialidad,
    (consultorio) => consultorio.especialidad,
  )
  consultorios: ConsultorioEspecialidad[];

  @OneToMany(() => Doctor, (doctor) => doctor.especialidad)
  doctores: Doctor[];

  @OneToMany(() => AsignacionDoctorConsultorio, (asig) => asig.especialidad)
  asignaciones: AsignacionDoctorConsultorio[];

  @OneToMany(() => ReservaPaciente, (reserva) => reserva.especialidad)
  reservas: ReservaPaciente[];

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
