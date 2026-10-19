import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Consulta } from './consulta.entity';

@Entity('hcl_ant_go')
export class HclAntGo {
  @PrimaryGeneratedColumn({ name: 'id_ant_go' })
  idAntGo: number;

  @ManyToOne(() => Consulta)
  @JoinColumn({ name: 'id_consulta' })
  consulta: Consulta;

  @Column({ name: 'id_consulta' })
  idConsulta: number;

  @Column({ name: 'gestas', type: 'int', default: 0 })
  gestas: number;

  @Column({ name: 'partos', type: 'int', default: 0 })
  partos: number;

  @Column({ name: 'abortos', type: 'int', default: 0 })
  abortos: number;

  @Column({ name: 'fum', type: 'date', nullable: true })
  fum: Date;

  @Column({ name: 'ritmo_menstrual', length: 150, nullable: true })
  ritmoMenstrual: string;

  @Column({ name: 'planificacion_familiar', default: false })
  planificacionFamiliar: boolean;

  @Column({ name: 'metodo_descripcion', type: 'text', nullable: true })
  metodoDescripcion: string;

  @Column({ name: 'fup_fua', type: 'date', nullable: true })
  fupFua: Date;
}
