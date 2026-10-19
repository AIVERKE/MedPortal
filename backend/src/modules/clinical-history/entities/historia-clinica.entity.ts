import { Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, Column } from 'typeorm';
import { Persona } from '../../users/entities/persona.entity';

@Entity('historia_clinica')
export class HistoriaClinica {
  @PrimaryGeneratedColumn({ name: 'id_hcl' })
  idHcl: number;

  @OneToOne(() => Persona)
  @JoinColumn({ name: 'id_persona' })
  persona: Persona;

  @Column({ name: 'id_persona' })
  idPersona: number;
}
