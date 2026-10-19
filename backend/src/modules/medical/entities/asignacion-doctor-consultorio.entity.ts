import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { ConsultorioEspecialidad } from './consultorio-especialidad.entity';
import { EspecialidadMedica } from './especialidad-medica.entity';

@Entity('asignacion_doctores_consultorio')
export class AsignacionDoctorConsultorio {
  @PrimaryGeneratedColumn({ name: 'id_asignacion_doctores_consultorio' })
  idAsignacionDoctoresConsultorio: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.asignaciones)
  @JoinColumn({ name: 'id_doctor' })
  doctor: Doctor;

  @ManyToOne(
    () => ConsultorioEspecialidad,
    (consultorio) => consultorio.asignaciones,
  )
  @JoinColumn({ name: 'id_consultorio' })
  consultorio: ConsultorioEspecialidad;

  @ManyToOne(
    () => EspecialidadMedica,
    (especialidad) => especialidad.asignaciones,
  )
  @JoinColumn({ name: 'id_especialidad' })
  especialidad: EspecialidadMedica;

  @Column({ name: 'dias_semana', length: 50, nullable: true })
  diasSemana: string;

  @Column({ name: 'turno', length: 20, nullable: true })
  turno: string;

  @Column({ name: 'hora_inicio', type: 'time', nullable: true })
  horaInicio: string;

  @Column({ name: 'hora_fin', type: 'time', nullable: true })
  horaFin: string;

  @Column({ name: 'duracion_cita', type: 'int', nullable: true })
  duracionCita: number;

  @Column({ name: 'cupos_disponibles', type: 'int', nullable: true })
  cuposDisponibles: number;

  /** Override de horas libres mensuales; si null se usa el cupo global de configuración. */
  @Column({ name: 'horas_libres_mensuales', type: 'int', nullable: true })
  horasLibresMensuales: number | null;

  @Column({ name: 'activo', default: true })
  activo: boolean;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
