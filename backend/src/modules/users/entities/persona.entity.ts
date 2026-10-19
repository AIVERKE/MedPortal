import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Estudiante } from './estudiante.entity';
import { Docente } from './docente.entity';
import { Administrativo } from './administrativo.entity';
import { Consultor } from './consultor.entity';
import { Usuario } from './usuario.entity';
import { AsignacionRol } from './asignacion-rol.entity';
import { Rol } from './rol.entity';
import { HistorialUsuario } from './historial-usuario.entity';
import { Doctor } from '../../medical/entities/doctor.entity';

@Entity('personas')
export class Persona {
  @PrimaryGeneratedColumn({ name: 'id_persona' })
  idPersona: number;

  @Column({ name: 'ci', length: 20, unique: true })
  ci: string;

  @Column({ name: 'nombres', length: 100 })
  nombres: string;

  @Column({ name: 'primer_apellido', length: 100 })
  primerApellido: string;

  @Column({ name: 'segundo_apellido', length: 100, nullable: true })
  segundoApellido: string;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento: Date;

  @Column({ name: 'genero', length: 20, nullable: true })
  genero: string;

  @Column({ name: 'celular', length: 20, nullable: true })
  celular: string;

  @Column({ name: 'email', length: 100, nullable: true })
  email: string;

  @Column({ name: 'direccion', type: 'text', nullable: true })
  direccion: string;

  @Column({ name: 'foto', length: 255, nullable: true })
  foto: string;

  @Column({
    name: 'fecha_registro',
    type: 'date',
    default: () => 'CURRENT_DATE',
  })
  fechaRegistro: Date;

  @Column({ name: 'activo', default: true })
  activo: boolean;

  // Relaciones Inversas (Uno a Uno)
  @OneToOne(() => Estudiante, (estudiante) => estudiante.persona)
  estudiante: Estudiante;

  @OneToOne(() => Docente, (docente) => docente.persona)
  docente: Docente;

  @OneToOne(() => Administrativo, (administrativo) => administrativo.persona)
  administrativo: Administrativo;

  @OneToOne(() => Consultor, (consultor) => consultor.persona)
  consultor: Consultor;

  @OneToOne(() => Usuario, (usuario) => usuario.persona)
  usuario: Usuario;

  @OneToOne(() => Doctor, (doctor) => doctor.persona)
  doctor: Doctor;

  // Relaciones (Uno a Muchos)
  @OneToMany(() => AsignacionRol, (rol) => rol.persona)
  asignacionesRoles: AsignacionRol[];

  @OneToMany(() => HistorialUsuario, (historial) => historial.persona)
  historialUsuarios: HistorialUsuario[];

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
