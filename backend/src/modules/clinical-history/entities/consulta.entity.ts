import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { HistoriaClinica } from './historia-clinica.entity';
import { ReservaPaciente } from '../../appointments/entities/reserva-paciente.entity';
import { Doctor } from '../../medical/entities/doctor.entity';
import { CatEnfermedad } from './cat-enfermedad.entity';

@Entity('consulta')
export class Consulta {
  @PrimaryGeneratedColumn({ name: 'id_consulta' })
  idConsulta: number;

  @ManyToOne(() => HistoriaClinica)
  @JoinColumn({ name: 'id_hcl' })
  historiaClinica: HistoriaClinica;

  @Column({ name: 'id_hcl' })
  idHcl: number;

  @ManyToOne(() => ReservaPaciente)
  @JoinColumn({ name: 'id_reserva_paciente' })
  reservaPaciente: ReservaPaciente;

  @Column({ name: 'id_reserva_paciente', nullable: true })
  idReservaPaciente: number;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'id_doctor' })
  doctor: Doctor;

  @Column({ name: 'id_doctor' })
  idDoctor: number;

  @ManyToOne(() => CatEnfermedad)
  @JoinColumn({ name: 'id_enfermedad' })
  enfermedad: CatEnfermedad;

  @Column({ name: 'id_enfermedad', nullable: true })
  idEnfermedad: number;

  @Column({ name: 'enfermedad_especificacion', length: 255, nullable: true })
  enfermedadEspecificacion: string;

  @Column({ name: 'motivo_consulta', type: 'text', nullable: true })
  motivoConsulta: string;

  @Column({ name: 'impresion_diagnostica', type: 'text', nullable: true })
  impresionDiagnostica: string;

  @Column({ name: 'conducta_tratamiento', type: 'text', nullable: true })
  conductaTratamiento: string;

  @Column({ name: 'evolucion', type: 'text', nullable: true })
  evolucion: string;

  @CreateDateColumn({ name: 'fecha_consulta' })
  fechaConsulta: Date;
}
