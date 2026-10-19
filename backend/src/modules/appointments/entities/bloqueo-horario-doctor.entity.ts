import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Doctor } from '../../medical/entities/doctor.entity';
import { AsignacionDoctorConsultorio } from '../../medical/entities/asignacion-doctor-consultorio.entity';

@Entity('bloqueos_horario_doctor')
@Unique('UQ_bloqueo_doctor_fecha_hora', ['doctor', 'fecha', 'horaInicio'])
export class BloqueoHorarioDoctor {
  @ApiProperty({ description: 'ID del bloqueo de horario', example: 1 })
  @PrimaryGeneratedColumn({ name: 'id_bloqueo_horario' })
  idBloqueoHorario: number;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_doctor' })
  doctor: Doctor;

  @ManyToOne(() => AsignacionDoctorConsultorio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_asignacion' })
  asignacion: AsignacionDoctorConsultorio;

  @ApiProperty({ description: 'Fecha del bloqueo', example: '2026-08-25' })
  @Column({ name: 'fecha', type: 'date' })
  fecha: Date | string;

  @ApiProperty({ description: 'Hora de inicio del slot', example: '10:00:00' })
  @Column({ name: 'hora_inicio', type: 'time' })
  horaInicio: string;

  @ApiProperty({ description: 'Hora de fin del slot', example: '10:20:00' })
  @Column({ name: 'hora_fin', type: 'time' })
  horaFin: string;

  @ApiProperty({
    description: 'Descripción opcional del bloqueo',
    example: 'Almuerzo',
    nullable: true,
    required: false,
  })
  @Column({ name: 'descripcion', type: 'varchar', length: 255, nullable: true })
  descripcion: string | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
