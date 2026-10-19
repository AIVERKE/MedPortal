import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Persona } from './persona.entity';
import { ContratoConsultor } from './contrato-consultor.entity';

@Entity('consultores')
export class Consultor {
  @PrimaryGeneratedColumn({ name: 'id_consultor' })
  idConsultor: number;

  @OneToOne(() => Persona, (persona) => persona.consultor)
  @JoinColumn({ name: 'id_persona' })
  persona: Persona;

  @Column({ name: 'fecha_sincronizacion', type: 'timestamp', nullable: true })
  fechaSincronizacion: Date;

  @OneToMany(() => ContratoConsultor, (contrato) => contrato.consultor)
  contratos: ContratoConsultor[];

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
