import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cat_enfermedades')
export class CatEnfermedad {
  @PrimaryGeneratedColumn({ name: 'id_enfermedad' })
  idEnfermedad: number;

  @Column({ name: 'codigo_cie10', length: 20, nullable: true })
  codigoCie10: string;

  @Column({ name: 'nombre_enfermedad', length: 255 })
  nombreEnfermedad: string;

  @Column({ name: 'es_cronica', default: false })
  esCronica: boolean;
}
