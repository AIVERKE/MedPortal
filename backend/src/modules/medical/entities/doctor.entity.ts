import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Persona } from '../../users/entities/persona.entity';
import { EspecialidadMedica } from './especialidad-medica.entity';
import { AsignacionDoctorConsultorio } from './asignacion-doctor-consultorio.entity';
import { ConsultaMedica } from '../../appointments/entities/consulta-medica.entity';
import { ReservaPaciente } from '../../appointments/entities/reserva-paciente.entity';
import { Emergencia } from './emergencia.entity';

@Entity('doctores')
export class Doctor {
  @PrimaryGeneratedColumn({ name: 'id_doctor' })
  idDoctor: number;

  @OneToOne(() => Persona, (persona) => persona.doctor)
  @JoinColumn({ name: 'id_persona' })
  persona: Persona;

  @ManyToOne(() => EspecialidadMedica, (especialidad) => especialidad.doctores)
  @JoinColumn({ name: 'id_especialidad_medica' })
  especialidad: EspecialidadMedica;

  @Column({ name: 'matricula_profesional', length: 50, nullable: true })
  matriculaProfesional: string;

  @Column({ name: 'experiencia_profesional', type: 'text', nullable: true })
  experienciaProfesional: string;

  @Column({ name: 'universidad_origen', length: 100, nullable: true })
  universidadOrigen: string;

  @Column({ name: 'titulo_profesional', length: 100, nullable: true })
  tituloProfesional: string;

  @Column({ name: 'telefono_emergencia', length: 20, nullable: true })
  telefonoEmergencia: string;

  /** Si es true, pacientes pueden ver telefonoEmergencia al reservar. */
  @Column({
    name: 'compartir_telefono_emergencia',
    type: 'boolean',
    default: false,
  })
  compartirTelefonoEmergencia: boolean;

  @OneToMany(() => AsignacionDoctorConsultorio, (asig) => asig.doctor)
  asignaciones: AsignacionDoctorConsultorio[];

  @OneToMany(() => ConsultaMedica, (consulta) => consulta.doctor)
  consultas: ConsultaMedica[];

  @OneToMany(() => ReservaPaciente, (reserva) => reserva.doctor)
  reservas: ReservaPaciente[];

  @OneToMany(() => Emergencia, (emergencia) => emergencia.doctor)
  emergencias: Emergencia[];

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
