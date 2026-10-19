import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Consulta } from './consulta.entity';
import { HistoriaClinica } from './historia-clinica.entity';
import { CatAntecedenteNoPat } from './cat-antecedente-no-pat.entity';

@Entity('hcl_no_patologicos')
export class HclNoPatologico {
  @PrimaryGeneratedColumn({ name: 'id_no_patologico' })
  idNoPatologico: number;

  @ManyToOne(() => Consulta)
  @JoinColumn({ name: 'id_consulta' })
  consulta: Consulta;

  @Column({ name: 'id_consulta' })
  idConsulta: number;

  @ManyToOne(() => HistoriaClinica)
  @JoinColumn({ name: 'id_hcl' })
  historiaClinica: HistoriaClinica;

  @Column({ name: 'id_hcl' })
  idHcl: number;

  @ManyToOne(() => CatAntecedenteNoPat)
  @JoinColumn({ name: 'id_cat_ant_no_pat' })
  catAntecedenteNoPat: CatAntecedenteNoPat;

  @Column({ name: 'id_cat_ant_no_pat' })
  idCatAntNoPat: number;

  @Column({ name: 'observacion', type: 'text', nullable: true })
  observacion: string;

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro: Date;
}
