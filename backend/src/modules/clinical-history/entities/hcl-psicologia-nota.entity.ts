import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { HistoriaClinica } from './historia-clinica.entity';
import { ReservaPaciente } from '../../appointments/entities/reserva-paciente.entity';
import { Doctor } from '../../medical/entities/doctor.entity';

@Entity('hcl_psicologia_notas')
export class HclPsicologiaNota {
  @PrimaryGeneratedColumn({ name: 'id_nota_psic' })
  idNotaPsic: number;

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
  @JoinColumn({ name: 'id_psicologo' })
  psicologo: Doctor;

  @Column({ name: 'id_psicologo' })
  idPsicologo: number;

  @Column({ name: 'nro_sesion', type: 'int', default: 1 })
  nroSesion: number;

  @Column({ name: 'motivo_consulta', type: 'text', nullable: true })
  motivoConsulta: string;

  @Column({ name: 'bitacora_confidencial', type: 'text', nullable: true })
  bitacoraConfidencial: string;

  @Column({ name: 'diagnostico_psic', type: 'text', nullable: true })
  diagnosticoPsic: string;

  @CreateDateColumn({ name: 'fecha_hora' })
  fechaHora: Date;
}
