import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Persona } from './persona.entity';

@Entity('administrativos')
export class Administrativo {
  @PrimaryGeneratedColumn({ name: 'id_administrativo' })
  idAdministrativo: number;

  @OneToOne(() => Persona, (persona) => persona.administrativo)
  @JoinColumn({ name: 'id_persona' })
  persona: Persona;

  @Column({ name: 'numero_item', length: 50, nullable: true })
  numeroItem: string;

  @Column({ name: 'unidad', length: 100, nullable: true })
  unidad: string;

  @Column({ name: 'cargo', length: 100, nullable: true })
  cargo: string;

  @Column({ name: 'fecha_sincronizacion', type: 'timestamp', nullable: true })
  fechaSincronizacion: Date;

  @Column({ name: 'estado_laboral', length: 50, nullable: true })
  estadoLaboral: string;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
