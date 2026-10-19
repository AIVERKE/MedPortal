import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Usuario } from '../../users/entities/usuario.entity';
import { ReservaPaciente } from '../../appointments/entities/reserva-paciente.entity';
import { NotificationType } from '../enums/notification-type.enum';

@Entity('notificaciones')
export class Notificacion {
  @ApiProperty({ description: 'ID de la notificación', example: 1 })
  @PrimaryGeneratedColumn({ name: 'id_notificacion' })
  idNotificacion: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ApiProperty({ description: 'Tipo de notificación', enum: NotificationType })
  @Column({ name: 'tipo', length: 50 })
  tipo: NotificationType;

  @ApiProperty({ description: 'Título de la notificación' })
  @Column({ name: 'titulo', length: 200 })
  titulo: string;

  @ApiProperty({ description: 'Mensaje de la notificación' })
  @Column({ name: 'mensaje', type: 'text' })
  mensaje: string;

  @ApiProperty({ description: 'Indica si la notificación fue leída' })
  @Column({ name: 'leida', default: false })
  leida: boolean;

  @ManyToOne(() => ReservaPaciente, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_reserva_paciente' })
  reservaPaciente: ReservaPaciente | null;

  @ApiProperty({ description: 'Metadatos adicionales', nullable: true })
  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @ApiProperty({ description: 'Clave de deduplicación' })
  @Column({ name: 'clave_dedup', length: 100, unique: true })
  claveDedup: string;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @ApiProperty({ description: 'Fecha en que se marcó como leída', nullable: true })
  @Column({ name: 'fecha_leida', type: 'timestamp', nullable: true })
  fechaLeida: Date | null;
}
