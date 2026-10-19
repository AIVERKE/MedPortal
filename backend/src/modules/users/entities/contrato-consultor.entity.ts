import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Consultor } from './consultor.entity';

@Entity('contratos_consultores')
export class ContratoConsultor {
  @PrimaryGeneratedColumn({ name: 'id_contrato_consultor' })
  idContratoConsultor: number;

  @ManyToOne(() => Consultor, (consultor) => consultor.contratos)
  @JoinColumn({ name: 'id_consultor' })
  consultor: Consultor;

  @Column({ name: 'id_servicio', type: 'int', nullable: true })
  idServicio: number;

  @Column({ name: 'unidad', length: 100, nullable: true })
  unidad: string;

  @Column({ name: 'fecha_inicio_contrato', type: 'date', nullable: true })
  fechaInicioContrato: Date;

  @Column({ name: 'fecha_fin_contrato', type: 'date', nullable: true })
  fechaFinContrato: Date;

  @Column({ name: 'cargo', length: 100, nullable: true })
  cargo: string;

  @Column({ name: 'documento_contrato_url', length: 255, nullable: true })
  documentoContratoUrl: string;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
