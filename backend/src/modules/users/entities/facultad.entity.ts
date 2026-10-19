import {
  Column,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Carrera } from './carrera.entity';

@Entity('facultades')
export class Facultad {
  @PrimaryGeneratedColumn({ name: 'id_facultad' })
  idFacultad: number;

  @Column({ name: 'nombre', length: 100, unique: true })
  nombre: string;

  @Column({ name: 'activo', default: true })
  activo: boolean;

  @OneToMany(() => Carrera, (carrera) => carrera.facultad)
  carreras: Carrera[];

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
