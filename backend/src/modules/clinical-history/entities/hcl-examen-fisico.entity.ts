import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Consulta } from './consulta.entity';

@Entity('hcl_examen_fisico')
export class HclExamenFisico {
  @PrimaryGeneratedColumn({ name: 'id_examen_fisico' })
  idExamenFisico: number;

  @ManyToOne(() => Consulta)
  @JoinColumn({ name: 'id_consulta' })
  consulta: Consulta;

  @Column({ name: 'id_consulta' })
  idConsulta: number;

  @Column({ name: 'presion_arterial', length: 50, nullable: true })
  presionArterial: string;

  @Column({ name: 'pulso', type: 'int', nullable: true })
  pulso: number;

  @Column({ name: 'temperatura', type: 'decimal', precision: 5, scale: 2, nullable: true })
  temperatura: number;

  @Column({ name: 'peso_kg', type: 'decimal', precision: 5, scale: 2, nullable: true })
  pesoKg: number;

  @Column({ name: 'talla_cm', type: 'decimal', precision: 5, scale: 2, nullable: true })
  tallaCm: number;

  @Column({ name: 'imc', type: 'decimal', precision: 5, scale: 2, nullable: true })
  imc: number;

  @Column({ name: 'sistemas_json', type: 'jsonb', nullable: true })
  sistemasJson: Record<string, any>;

  @Column({ name: 'observaciones_fisicas', type: 'text', nullable: true })
  observacionesFisicas: string;
}
