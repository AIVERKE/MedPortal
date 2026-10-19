import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Persona } from './persona.entity';
import { ReservaPaciente } from '../../appointments/entities/reserva-paciente.entity';
import { Pago } from '../../appointments/entities/pago.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  idUsuario: number;

  @OneToOne(() => Persona, (persona) => persona.usuario)
  @JoinColumn({ name: 'id_persona' })
  persona: Persona;

  @Column({ name: 'username', length: 50, unique: true })
  username: string;

  @Column({ name: 'password', length: 255 })
  password: string;

  @Column({ name: 'bloqueado', default: false })
  bloqueado: boolean;

  @Column({ name: 'is_book', type: 'boolean', default: false })
  is_book: boolean;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @OneToMany(() => ReservaPaciente, (reserva) => reserva.usuario)
  reservas: ReservaPaciente[];

  @OneToMany(() => Pago, (pago) => pago.usuarioRegistro)
  pagosRegistrados: Pago[];
}
