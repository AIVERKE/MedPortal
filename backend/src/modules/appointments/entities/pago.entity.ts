import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ConsultaMedica } from './consulta-medica.entity';
import { Usuario } from '../../users/entities/usuario.entity';

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn({ name: 'id_pago' })
  idPago: number;

  @ManyToOne(() => ConsultaMedica, (consulta) => consulta.pagos)
  @JoinColumn({ name: 'id_consulta_medica' })
  consulta: ConsultaMedica;

  @Column({
    name: 'monto',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  monto: number;

  @Column({ name: 'exento', default: false })
  exento: boolean;

  @Column({ name: 'motivo_exencion', type: 'text', nullable: true })
  motivoExencion: string;

  @Column({
    name: 'fecha_pago',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaPago: Date;

  @Column({ name: 'metodo_pago', length: 50, nullable: true })
  metodoPago: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.pagosRegistrados)
  @JoinColumn({ name: 'id_usuario_registro_pago' })
  usuarioRegistro: Usuario;
}
