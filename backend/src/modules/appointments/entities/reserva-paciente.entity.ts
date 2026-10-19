import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  DeleteDateColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Usuario } from '../../users/entities/usuario.entity';
import { EspecialidadMedica } from '../../medical/entities/especialidad-medica.entity';
import { PostaMedica } from '../../medical/entities/posta-medica.entity';
import { ConsultaMedica } from './consulta-medica.entity';
import { Doctor } from '../../medical/entities/doctor.entity';

@Entity('reservas_paciente')
@Unique('uq_doctor_disponibilidad', ['doctor', 'fechaCita', 'horaInicioCita'])
@Unique('uq_cita_paciente', ['usuario', 'fechaCita', 'horaInicioCita'])
export class ReservaPaciente {
  @ApiProperty({ description: 'ID de la reserva de paciente', example: 1 })
  @PrimaryGeneratedColumn({ name: 'id_reserva_paciente' })
  idReservaPaciente: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.reservas)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => EspecialidadMedica, (especialidad) => especialidad.reservas)
  @JoinColumn({ name: 'id_especialidad' })
  especialidad: EspecialidadMedica;

  @ManyToOne(() => PostaMedica, (posta) => posta.reservas)
  @JoinColumn({ name: 'id_posta' })
  posta: PostaMedica;

  @ManyToOne(() => Doctor, (doctor) => doctor.reservas)
  @JoinColumn({ name: 'id_doctor' })
  doctor: Doctor;

  @ApiProperty({ description: 'Fecha de la cita', example: '2024-10-25', nullable: true })
  @Column({ name: 'fecha_cita', type: 'date', nullable: true })
  fechaCita: Date | null;

  @ApiProperty({ description: 'Hora de inicio de la cita', example: '10:00:00', nullable: true })
  @Column({ name: 'hora_inicio_cita', type: 'time', nullable: true })
  horaInicioCita: string | null;

  @ApiProperty({ description: 'Hora de fin de la cita', example: '10:30:00', nullable: true })
  @Column({ name: 'hora_fin_cita', type: 'time', nullable: true })
  horaFinCita: string | null;

  @ApiProperty({
    description: 'Fecha en la que se solicitó la cita',
    example: '2024-10-24T14:30:00Z',
  })
  @Column({
    name: 'fecha_solicitud',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaSolicitud: Date;

  @ApiProperty({
    description: 'Fecha de cancelación de la cita',
    nullable: true,
    example: '2024-10-24T15:00:00Z',
  })
  @Column({ name: 'fecha_cancelacion_cita', type: 'timestamp', nullable: true })
  fechaCancelacionCita: Date;

  @ApiProperty({
    description: 'Motivo de la cancelación',
    nullable: true,
    example: 'Emergencia médica',
  })
  @Column({ name: 'motivo_cancelacion', type: 'text', nullable: true })
  motivoCancelacion: string;

  @ApiProperty({
    description: 'Observaciones de la reserva',
    nullable: true,
    example: 'Paciente requiere silla de ruedas',
  })
  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones: string;

  @ApiProperty({
    description: 'Mensaje de la última reagendación',
    nullable: true,
  })
  @Column({ name: 'motivo_reagendacion', type: 'text', nullable: true })
  motivoReagendacion: string | null;

  @ApiProperty({
    description: 'Estado de la reserva',
    example: 'PENDIENTE',
    enum: [
      'PENDIENTE',
      'PRESENTE',
      'ATRASO',
      'ABANDONO',
      'CANCELADA',
      'ATENDIDO',
      'A-FUERA-HORARIO',
      'A-SIN-RESERVA',
    ],
  })
  @Column({ name: 'estado', length: 20, default: 'PENDIENTE' })
  estado: string;

  @ApiProperty({
    description: 'Fecha en la que el paciente fue atendido',
    nullable: true,
    example: '2024-10-25',
  })
  @Column({ name: 'fecha_atendido', type: 'date', nullable: true })
  fechaAtendido: Date;

  @ApiProperty({
    description: 'Hora en la que el paciente fue atendido',
    nullable: true,
    example: '10:15:00',
  })
  @Column({ name: 'hora_atendido', type: 'time', nullable: true })
  horaAtendido: string;

  @OneToOne(() => ConsultaMedica, (consulta) => consulta.reserva)
  consulta: ConsultaMedica;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
