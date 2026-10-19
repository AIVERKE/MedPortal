import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cat_antecedentes_no_pat')
export class CatAntecedenteNoPat {
  @PrimaryGeneratedColumn({ name: 'id_cat_ant_no_pat' })
  idCatAntNoPat: number;

  @Column({ name: 'nombre_antecedente', length: 150 })
  nombreAntecedente: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string;
}
