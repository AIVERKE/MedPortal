import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
} from 'typeorm';

@Entity('configuracion_reservas_consultas')
export class ConfiguracionReservaConsulta {
  @PrimaryGeneratedColumn({ name: 'id_configuracion_reservas_medicas' })
  idConfiguracionReservasMedicas: number;

  @Column({ name: 'dias_semana', length: 100, nullable: true })
  diasSemana: string;

  @Column({ name: 'hora_inicio_reserva', type: 'time', nullable: true })
  horaInicioReserva: string;

  @Column({ name: 'hora_fin_reserva', type: 'time', nullable: true })
  horaFinReserva: string;

  @Column({ name: 'dias_anticipacion_minima', type: 'int', nullable: true })
  diasAnticipacionMinima: number;

  @Column({ name: 'dias_anticipacion_maxima', type: 'int', nullable: true })
  diasAnticipacionMaxima: number;

  /** Cupo global de horas libres mensuales para bloqueos de doctor (horas enteras). */
  @Column({ name: 'horas_libres_mensuales', type: 'int', nullable: true })
  horasLibresMensuales: number | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
