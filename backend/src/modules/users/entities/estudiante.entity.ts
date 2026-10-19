import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  DeleteDateColumn,
} from 'typeorm';
import { Persona } from './persona.entity';
import { Facultad } from './facultad.entity';
import { Carrera } from './carrera.entity';

@Entity('estudiantes')
export class Estudiante {
  @PrimaryGeneratedColumn({ name: 'id_estudiante' })
  idEstudiante: number;

  @OneToOne(() => Persona, (persona) => persona.estudiante)
  @JoinColumn({ name: 'id_persona' })
  persona: Persona;

  @Column({
    name: 'registro_universitario',
    length: 50,
    unique: true,
    nullable: true,
  })
  registroUniversitario: string;

  @Column({ name: 'carrera', length: 100, nullable: true })
  carrera: string;

  @Column({ name: 'facultad', length: 100, nullable: true })
  facultad: string;

  @ManyToOne(() => Facultad, { nullable: true })
  @JoinColumn({ name: 'id_facultad' })
  facultadCatalogo: Facultad;

  @ManyToOne(() => Carrera, { nullable: true })
  @JoinColumn({ name: 'id_carrera' })
  carreraCatalogo: Carrera;

  @Column({ name: 'documento_matricula_url', length: 255, nullable: true })
  documentoMatriculaUrl: string;

  @Column({ name: 'documento_carnet_url', length: 255, nullable: true })
  documentoCarnetUrl: string;

  @Column({ name: 'fecha_sincronizacion', type: 'timestamp', nullable: true })
  fechaSincronizacion: Date;

  @Column({ name: 'estado_academico', length: 50, nullable: true })
  estadoAcademico: string;

  @Column({ name: 'activo', default: true })
  activo: boolean;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
