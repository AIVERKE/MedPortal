import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Facultad } from './facultad.entity';

@Entity('carreras')
export class Carrera {
  @PrimaryGeneratedColumn({ name: 'id_carrera' })
  idCarrera: number;

  @Column({ name: 'nombre', length: 100 })
  nombre: string;

  @ManyToOne(() => Facultad, (facultad) => facultad.carreras, { nullable: false })
  @JoinColumn({ name: 'id_facultad' })
  facultad: Facultad;

  @Column({ name: 'activo', default: true })
  activo: boolean;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
