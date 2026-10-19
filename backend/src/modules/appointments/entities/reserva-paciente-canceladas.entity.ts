import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Usuario } from '../../users/entities/usuario.entity';
import { EspecialidadMedica } from '../../medical/entities/especialidad-medica.entity';
import { PostaMedica } from '../../medical/entities/posta-medica.entity';
import { Doctor } from '../../medical/entities/doctor.entity';

@Entity('reservas_paciente_canceladas')
export class ReservaPacienteCancelada {
  @PrimaryGeneratedColumn({ name: 'id_reserva_cancelada' })
  idReservaCancelada: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => EspecialidadMedica)
  @JoinColumn({ name: 'id_especialidad' })
  especialidad: EspecialidadMedica;

  @ManyToOne(() => PostaMedica)
  @JoinColumn({ name: 'id_posta' })
  posta: PostaMedica;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'id_doctor' })
  doctor: Doctor;

  @Column({ name: 'fecha_cita', type: 'date', nullable: true })
  fechaCita: Date | null;

  @Column({ name: 'hora_inicio_cita', type: 'time', nullable: true })
  horaInicioCita: string | null;

  @Column({ name: 'hora_fin_cita', type: 'time', nullable: true })
  horaFinCita: string | null;

  @Column({
    name: 'fecha_solicitud',
    type: 'timestamp',
  })
  fechaSolicitud: Date;

  @Column({
    name: 'fecha_cancelacion_cita',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaCancelacionCita: Date;

  @Column({ name: 'motivo_cancelacion', type: 'text', nullable: true })
  motivoCancelacion: string;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones: string;

  @Column({ name: 'estado', length: 20, default: 'CANCELADO' })
  estado: string;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
