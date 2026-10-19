import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('consejo_diario')
export class ConsejoDiario {
  @PrimaryGeneratedColumn()
  idConsejoDiario: number;

  @Column({ type: 'varchar', length: 150 })
  titulo: string;

  @Column({ type: 'text' })
  contenido: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  categoria: string;

  @Column({ type: 'date', nullable: true })
  fechaPublicacion: Date;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ type: 'date', name: 'fecha_creacion' })
  fecha_creacion: Date;
}
