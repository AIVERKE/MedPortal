import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Persona } from './persona.entity';

@Entity('docentes')
export class Docente {
  @PrimaryGeneratedColumn({ name: 'id_docente' })
  idDocente: number;

  @OneToOne(() => Persona, (persona) => persona.docente)
  @JoinColumn({ name: 'id_persona' })
  persona: Persona;

  @Column({ name: 'numero_item', length: 50, nullable: true })
  numeroItem: string;

  @Column({ name: 'facultad', length: 100, nullable: true })
  facultad: string;

  @Column({ name: 'fecha_sincronizacion', type: 'timestamp', nullable: true })
  fechaSincronizacion: Date;

  @Column({ name: 'interino_contratado', length: 50, nullable: true })
  interinoContratado: string;

  @Column({ name: 'activo', default: true })
  activo: boolean;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
