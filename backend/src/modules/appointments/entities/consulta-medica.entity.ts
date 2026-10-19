import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ReservaPaciente } from './reserva-paciente.entity';
import { Doctor } from '../../medical/entities/doctor.entity';
import { Pago } from './pago.entity';

@Entity('consultas_medicas')
export class ConsultaMedica {
  @PrimaryGeneratedColumn({ name: 'id_consulta_medica' })
  idConsultaMedica: number;

  @OneToOne(() => ReservaPaciente, (reserva) => reserva.consulta)
  @JoinColumn({ name: 'id_reserva_paciente' })
  reserva: ReservaPaciente;

  @ManyToOne(() => Doctor, (doctor) => doctor.consultas)
  @JoinColumn({ name: 'id_doctor' })
  doctor: Doctor;

  @Column({
    name: 'peso_kl',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  pesoKl: number;

  @Column({
    name: 'estatura_cm',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  estaturaCm: number;

  @Column({ name: 'presion_arterial', length: 20, nullable: true })
  presionArterial: string;

  @Column({
    name: 'temperatura',
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: true,
  })
  temperatura: number;

  @Column({ name: 'frecuencia_cardiaca', type: 'int', nullable: true })
  frecuenciaCardiaca: number;

  @Column({ name: 'motivo_consulta', type: 'text', nullable: true })
  motivoConsulta: string;

  @Column({ name: 'sintomas', type: 'text', nullable: true })
  sintomas: string;

  @OneToMany(() => Pago, (pago) => pago.consulta)
  pagos: Pago[];
}
