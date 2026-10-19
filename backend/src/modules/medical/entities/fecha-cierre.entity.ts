import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
} from 'typeorm';

@Entity('fecha_cierre')
export class FechaCierre {
  @PrimaryGeneratedColumn({ name: 'id_fecha_cierre' })
  idFechaCierre: number;

  @Column({ name: 'fecha', type: 'date' })
  fecha: Date;

  @Column({ name: 'descripcion', length: 255, nullable: true })
  descripcion: string;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
