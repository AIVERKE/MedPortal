import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EspecialidadMedica } from './especialidad-medica.entity';
import { Doctor } from './doctor.entity';
import { HistoriaClinica } from '../../clinical-history/entities/historia-clinica.entity';
import { Consulta } from '../../clinical-history/entities/consulta.entity';

@Entity('derivaciones')
export class Derivacion {
  @ApiProperty({ description: 'ID único de la derivación', example: 1 })
  @PrimaryGeneratedColumn({ name: 'id_derivacion' })
  idDerivacion: number;

  @ManyToOne(() => HistoriaClinica)
  @JoinColumn({ name: 'id_hcl' })
  historiaClinica: HistoriaClinica;

  @ApiProperty({ description: 'ID de la historia clínica asociada', example: 1 })
  @Column({ name: 'id_hcl' })
  idHcl: number;

  @ManyToOne(() => Consulta)
  @JoinColumn({ name: 'id_consulta_origen' })
  consultaOrigen: Consulta;

  @ApiProperty({ description: 'ID de la consulta de origen', example: 1 })
  @Column({ name: 'id_consulta_origen', nullable: true })
  idConsultaOrigen: number;

  @ManyToOne(() => EspecialidadMedica)
  @JoinColumn({ name: 'id_especialidad' })
  especialidad: EspecialidadMedica;

  @ApiProperty({ description: 'ID de la especialidad asociada', example: 2 })
  @Column({ name: 'id_especialidad' })
  idEspecialidad: number;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'id_doctor_emisor' })
  doctorEmisor: Doctor;

  @ApiProperty({
    description: 'ID del doctor que realiza la derivacion',
    example: 1,
  })
  @Column({ name: 'id_doctor_emisor' })
  idDoctorEmisor: number;

  @ApiProperty({ description: 'Motivo de referencia', example: 'Derivación por especialista' })
  @Column({ name: 'motivo_referencia', type: 'text', nullable: true })
  motivoReferencia: string;

  @ApiProperty({ description: 'Diagnostico presuntivo', example: 'Gingivitis' })
  @Column({ name: 'diagnostico_presuntivo', type: 'text', nullable: true })
  diagnosticoPresuntivo: string;

  @ApiProperty({ description: 'Resumen de salud', example: 'Paciente estable' })
  @Column({ name: 'resumen_salud', type: 'text', nullable: true })
  resumenSalud: string;

  @ApiProperty({ description: 'Estado', example: 'PENDIENTE' })
  @Column({ name: 'estado', length: 50, default: 'PENDIENTE' })
  estado: string;

  @ApiProperty({
    description: 'Fecha de creación de la derivación',
    example: '2024-02-20T12:00:00Z',
  })
  @CreateDateColumn({ name: 'fecha_emision' })
  fechaEmision: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
