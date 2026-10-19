import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Doctor } from './doctor.entity';

@Entity('emergencias')
export class Emergencia {
  @ApiProperty({
    example: 1,
    description: 'Identificador único de la emergencia',
  })
  @PrimaryGeneratedColumn({ name: 'id_emergencia' })
  idEmergencia: number;

  @ApiProperty({
    type: () => Doctor,
    description: 'Doctor que atendió la emergencia',
  })
  @ManyToOne(() => Doctor, (doctor) => doctor.emergencias)
  @JoinColumn({ name: 'id_doctor' })
  doctor: Doctor;

  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del paciente',
  })
  @Column({ name: 'nombre_paciente', length: 255 })
  nombrePaciente: string;

  @ApiProperty({
    example: '2024-04-07',
    description: 'Fecha de la atención',
  })
  @Column({ name: 'fecha_atencion', type: 'date' })
  fechaAtencion: Date;

  @ApiProperty({
    example: '10:30:00',
    description: 'Hora de inicio de la atención',
  })
  @Column({ name: 'hora_inicio', type: 'time' })
  horaInicio: string;

  @ApiProperty({
    example: '11:15:00',
    description: 'Hora de fin de la atención',
  })
  @Column({ name: 'hora_fin', type: 'time' })
  horaFin: string;

  @ApiProperty({
    example: 'Paciente con dolor abdominal agudo',
    description: 'Descripción detallada del caso y acciones tomadas',
  })
  @Column({ name: 'descripcion_caso', type: 'text' })
  descripcionCaso: string;

  @ApiProperty({
    example: null,
    description: 'Fecha de eliminación lógica',
    required: false,
  })
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
