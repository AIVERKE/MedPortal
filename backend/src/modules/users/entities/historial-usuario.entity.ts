import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Persona } from './persona.entity';

@Entity('historial_usuarios')
export class HistorialUsuario {
  @PrimaryGeneratedColumn({ name: 'id_historial_usuario' })
  idHistorialUsuario: number;

  @ManyToOne(() => Persona, (persona) => persona.historialUsuarios)
  @JoinColumn({ name: 'id_persona' })
  persona: Persona;

  @CreateDateColumn({ name: 'fecha_hora_acceso' })
  fechaHoraAcceso: Date;

  @Column({ name: 'intento_fallido', default: false })
  intentoFallido: boolean;
}
