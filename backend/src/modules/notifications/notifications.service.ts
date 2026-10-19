import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';
import { CreateNotificacionDto } from './dto/create-notificacion.dto';
import { NotificationType } from './enums/notification-type.enum';
import { ReservaPaciente } from '../appointments/entities/reserva-paciente.entity';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { MailService, AppointmentMailContext } from '../mail/mail.service';
import {
  formatDisplayDate,
  formatTimeShort,
  getPersonaFullName,
} from './utils/notification-date.util';

export interface NotificationMessage {
  titulo: string;
  mensaje: string;
  metadata: Record<string, unknown>;
}

export interface PreviousSlot {
  fechaCita: string | Date | null;
  horaInicioCita: string | null;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacionRepository: Repository<Notificacion>,
    private readonly usuariosService: UsuariosService,
    private readonly mailService: MailService,
  ) {}

  async createIfNotExists(dto: CreateNotificacionDto): Promise<Notificacion | null> {
    const existing = await this.notificacionRepository.findOne({
      where: { claveDedup: dto.claveDedup },
    });
    if (existing) return null;

    const notificacion = this.notificacionRepository.create({
      usuario: { idUsuario: dto.idUsuario },
      tipo: dto.tipo,
      titulo: dto.titulo,
      mensaje: dto.mensaje,
      reservaPaciente: dto.idReservaPaciente
        ? { idReservaPaciente: dto.idReservaPaciente }
        : null,
      metadata: dto.metadata ?? null,
      claveDedup: dto.claveDedup,
      leida: false,
    });

    return this.notificacionRepository.save(notificacion);
  }

  async findByUsuario(
    idUsuario: number,
    options?: { soloNoLeidas?: boolean; limit?: number },
  ): Promise<Notificacion[]> {
    const qb = this.notificacionRepository
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.reservaPaciente', 'reserva')
      .where('n.id_usuario = :idUsuario', { idUsuario })
      .orderBy('n.fecha_creacion', 'DESC');

    if (options?.soloNoLeidas) {
      qb.andWhere('n.leida = false');
    }
    if (options?.limit) {
      qb.take(options.limit);
    }

    return qb.getMany();
  }

  async countUnread(idUsuario: number): Promise<number> {
    return this.notificacionRepository.count({
      where: { usuario: { idUsuario }, leida: false },
    });
  }

  async markAsRead(id: number, idUsuario: number): Promise<Notificacion> {
    const notificacion = await this.notificacionRepository.findOne({
      where: { idNotificacion: id },
      relations: ['usuario'],
    });

    if (!notificacion) {
      throw new NotFoundException(`Notificación con ID ${id} no encontrada.`);
    }
    if (notificacion.usuario.idUsuario !== idUsuario) {
      throw new ForbiddenException('No tienes permiso para modificar esta notificación.');
    }

    notificacion.leida = true;
    notificacion.fechaLeida = new Date();
    return this.notificacionRepository.save(notificacion);
  }

  async detachReservaReferences(idReservaPaciente: number): Promise<void> {
    await this.notificacionRepository
      .createQueryBuilder()
      .update(Notificacion)
      .set({ reservaPaciente: null })
      .where('id_reserva_paciente = :idReservaPaciente', { idReservaPaciente })
      .execute();
  }

  async markAllAsRead(idUsuario: number): Promise<{ updated: number }> {
    const result = await this.notificacionRepository
      .createQueryBuilder()
      .update(Notificacion)
      .set({ leida: true, fechaLeida: new Date() })
      .where('id_usuario = :idUsuario', { idUsuario })
      .andWhere('leida = false')
      .execute();
    return { updated: result.affected ?? 0 };
  }

  buildDedupKey(
    tipo: NotificationType,
    idReservaPaciente: number | null,
    idUsuario: number,
    extra?: string,
  ): string {
    if (extra) return `${tipo}:${extra}:${idUsuario}`;
    if (idReservaPaciente) return `${tipo}:${idReservaPaciente}:${idUsuario}`;
    return `${tipo}:${idUsuario}`;
  }

  buildMessage(
    reserva: ReservaPaciente,
    tipo: NotificationType,
    recipientRole: 'paciente' | 'doctor',
  ): NotificationMessage {
    const doctorNombre = getPersonaFullName(reserva.doctor?.persona);
    const pacienteNombre = getPersonaFullName(reserva.usuario?.persona);
    const especialidad = reserva.especialidad?.nombre ?? 'Consulta médica';
    const posta = reserva.posta?.nombre ?? 'Posta médica';
    const fecha = formatDisplayDate(reserva.fechaCita);
    const hora = formatTimeShort(reserva.horaInicioCita);

    const metadata: Record<string, unknown> = {
      fechaCita: reserva.fechaCita,
      horaInicioCita: reserva.horaInicioCita,
      doctor: doctorNombre,
      especialidad,
      posta,
      idReservaPaciente: reserva.idReservaPaciente,
    };

    switch (tipo) {
      case NotificationType.CITA_RECORDATORIO_24H:
        if (recipientRole === 'doctor') {
          return {
            titulo: 'Consulta mañana',
            mensaje: `Mañana a las ${hora} tienes consulta con ${pacienteNombre} (${especialidad}) en ${posta}.`,
            metadata: { ...metadata, paciente: pacienteNombre },
          };
        }
        return {
          titulo: 'Recordatorio de cita',
          mensaje: `Tu cita con Dr. ${doctorNombre} es mañana a las ${hora} en ${posta} (${especialidad}).`,
          metadata,
        };

      case NotificationType.CITA_RECORDATORIO_1H:
        if (recipientRole === 'doctor') {
          return {
            titulo: 'Consulta en 1 hora',
            mensaje: `Consulta con ${pacienteNombre} en 1 hora (${hora}) — ${especialidad}.`,
            metadata: { ...metadata, paciente: pacienteNombre },
          };
        }
        return {
          titulo: 'Tu cita comienza pronto',
          mensaje: `Tu cita con Dr. ${doctorNombre} comienza en 1 hora (${hora}) en ${posta}.`,
          metadata,
        };

      case NotificationType.CITA_RECORDATORIO_DIA:
        return {
          titulo: 'Cita programada para hoy',
          mensaje: `Hoy tienes cita a las ${hora} con Dr. ${doctorNombre} (${especialidad}) en ${posta}.`,
          metadata,
        };

      case NotificationType.CITA_NUEVA_RESERVA:
        return this.buildNewReservationDoctorMessage(reserva);

      case NotificationType.CITA_CONFIRMADA_PACIENTE:
        return {
          titulo: 'Cita confirmada',
          mensaje: `Tu cita con Dr. ${doctorNombre} quedó registrada el ${fecha} a las ${hora} en ${posta} (${especialidad}).`,
          metadata,
        };

      case NotificationType.CITA_CANCELADA:
        return {
          titulo: 'Cita cancelada',
          mensaje:
            recipientRole === 'doctor'
              ? `Se canceló la cita con ${pacienteNombre} del ${fecha} a las ${hora}.`
              : `Se canceló tu cita con Dr. ${doctorNombre} del ${fecha} a las ${hora}.`,
          metadata: { ...metadata, paciente: pacienteNombre },
        };

      case NotificationType.CITA_REAGENDADA:
        return {
          titulo: 'Cita reagendada',
          mensaje:
            recipientRole === 'doctor'
              ? `La cita con ${pacienteNombre} fue reagendada al ${fecha} a las ${hora}.`
              : `Tu cita con Dr. ${doctorNombre} fue reagendada al ${fecha} a las ${hora} en ${posta}.`,
          metadata: { ...metadata, paciente: pacienteNombre },
        };

      default:
        return {
          titulo: 'Recordatorio de cita',
          mensaje: `Tienes una cita el ${fecha} a las ${hora} con Dr. ${doctorNombre}.`,
          metadata,
        };
    }
  }

  buildDoctorDailySummary(
    citas: ReservaPaciente[],
    fechaKey: string,
  ): NotificationMessage {
    const count = citas.length;
    const lines = citas
      .slice(0, 8)
      .map((c) => {
        const hora = formatTimeShort(c.horaInicioCita);
        const paciente = getPersonaFullName(c.usuario?.persona);
        const esp = c.especialidad?.nombre ?? 'Consulta';
        return `${hora} ${paciente} (${esp})`;
      })
      .join(', ');

    const suffix = count > 8 ? ` y ${count - 8} más` : '';

    return {
      titulo: 'Resumen de consultas del día',
      mensaje: `Buenos días. Tienes ${count} consulta${count === 1 ? '' : 's'} programada${count === 1 ? '' : 's'} para hoy: ${lines}${suffix}.`,
      metadata: {
        fecha: fechaKey,
        totalCitas: count,
        idReservas: citas.map((c) => c.idReservaPaciente),
      },
    };
  }

  buildNewReservationDoctorMessage(reserva: ReservaPaciente): NotificationMessage {
    const persona = reserva.usuario?.persona;
    const pacienteNombre = getPersonaFullName(persona);
    const fecha = formatDisplayDate(reserva.fechaCita);
    const hora = formatTimeShort(reserva.horaInicioCita);
    const posta = reserva.posta?.nombre ?? 'Posta médica';
    const postaDireccion = reserva.posta?.direccion ?? '';
    const especialidad = reserva.especialidad?.nombre ?? 'Consulta médica';

    return {
      titulo: 'Nueva reserva de cita',
      mensaje: `${pacienteNombre} reservó una cita contigo el ${fecha} a las ${hora} en ${posta} (${especialidad}).`,
      metadata: {
        fechaCita: reserva.fechaCita,
        fechaCitaDisplay: fecha,
        horaInicioCita: reserva.horaInicioCita,
        posta,
        postaDireccion,
        especialidad,
        paciente: pacienteNombre,
        pacienteCi: persona?.ci ?? null,
        pacienteCelular: persona?.celular ?? null,
        pacienteEmail: persona?.email ?? null,
        idReservaPaciente: reserva.idReservaPaciente,
      },
    };
  }

  /** @deprecated Prefer notifyReservationCreated */
  async notifyDoctorNewReservation(reserva: ReservaPaciente): Promise<void> {
    await this.notifyReservationCreated(reserva);
  }

  async notifyReservationCreated(reserva: ReservaPaciente): Promise<void> {
    if (!reserva.idReservaPaciente) return;

    const mailCtx = this.toMailContext(reserva);
    const doctorUsuario = await this.resolveDoctorUsuario(reserva);
    const idPaciente = reserva.usuario?.idUsuario;

    if (doctorUsuario) {
      const msg = this.buildNewReservationDoctorMessage(reserva);
      await this.createIfNotExists({
        idUsuario: doctorUsuario.idUsuario,
        tipo: NotificationType.CITA_NUEVA_RESERVA,
        titulo: msg.titulo,
        mensaje: msg.mensaje,
        idReservaPaciente: reserva.idReservaPaciente,
        metadata: msg.metadata,
        claveDedup: this.buildDedupKey(
          NotificationType.CITA_NUEVA_RESERVA,
          reserva.idReservaPaciente,
          doctorUsuario.idUsuario,
        ),
      });
      await this.safeMail(() =>
        this.mailService.sendAppointmentCreatedToDoctor(
          this.doctorEmail(reserva),
          mailCtx,
        ),
      );
    }

    if (idPaciente) {
      const msg = this.buildMessage(
        reserva,
        NotificationType.CITA_CONFIRMADA_PACIENTE,
        'paciente',
      );
      await this.createIfNotExists({
        idUsuario: idPaciente,
        tipo: NotificationType.CITA_CONFIRMADA_PACIENTE,
        titulo: msg.titulo,
        mensaje: msg.mensaje,
        idReservaPaciente: reserva.idReservaPaciente,
        metadata: msg.metadata,
        claveDedup: this.buildDedupKey(
          NotificationType.CITA_CONFIRMADA_PACIENTE,
          reserva.idReservaPaciente,
          idPaciente,
        ),
      });
      await this.safeMail(() =>
        this.mailService.sendAppointmentConfirmedToPatient(
          this.patientEmail(reserva),
          mailCtx,
        ),
      );
    }
  }

  async notifyReservationCancelled(
    reserva: ReservaPaciente,
    cancelledBy: 'doctor' | 'paciente',
    motivo?: string | null,
  ): Promise<void> {
    if (!reserva.idReservaPaciente) return;

    const cancelledByLabel =
      cancelledBy === 'doctor' ? 'el doctor' : 'el paciente';
    const nota = motivo?.trim()
      ? ` Mensaje: ${motivo.trim()}`
      : '';
    const mailCtx: AppointmentMailContext = {
      ...this.toMailContext(reserva),
      cancelledByLabel,
      nota: motivo?.trim() || undefined,
    };
    const extra = `${cancelledBy}:${Date.now()}`;

    const idPaciente = reserva.usuario?.idUsuario;
    if (idPaciente) {
      const msg = this.buildMessage(
        reserva,
        NotificationType.CITA_CANCELADA,
        'paciente',
      );
      await this.createIfNotExists({
        idUsuario: idPaciente,
        tipo: NotificationType.CITA_CANCELADA,
        titulo: msg.titulo,
        mensaje: `${msg.mensaje} (Cancelada por ${cancelledByLabel}.)${nota}`,
        metadata: { ...msg.metadata, cancelledBy, motivo: motivo?.trim() || null },
        claveDedup: this.buildDedupKey(
          NotificationType.CITA_CANCELADA,
          reserva.idReservaPaciente,
          idPaciente,
          extra,
        ),
      });
      await this.safeMail(() =>
        this.mailService.sendAppointmentCancelled(
          this.patientEmail(reserva),
          mailCtx,
        ),
      );
    }

    const doctorUsuario = await this.resolveDoctorUsuario(reserva);
    if (doctorUsuario) {
      const msg = this.buildMessage(
        reserva,
        NotificationType.CITA_CANCELADA,
        'doctor',
      );
      await this.createIfNotExists({
        idUsuario: doctorUsuario.idUsuario,
        tipo: NotificationType.CITA_CANCELADA,
        titulo: msg.titulo,
        mensaje: `${msg.mensaje} (Cancelada por ${cancelledByLabel}.)${nota}`,
        metadata: { ...msg.metadata, cancelledBy, motivo: motivo?.trim() || null },
        claveDedup: this.buildDedupKey(
          NotificationType.CITA_CANCELADA,
          reserva.idReservaPaciente,
          doctorUsuario.idUsuario,
          extra,
        ),
      });
      await this.safeMail(() =>
        this.mailService.sendAppointmentCancelled(
          this.doctorEmail(reserva),
          mailCtx,
        ),
      );
    }
  }

  async notifyReservationRescheduled(
    reserva: ReservaPaciente,
    previousSlot: PreviousSlot,
  ): Promise<void> {
    if (!reserva.idReservaPaciente) return;

    const nota = reserva.motivoReagendacion?.trim() || '';
    const mailCtx: AppointmentMailContext = {
      ...this.toMailContext(reserva),
      previousFecha: formatDisplayDate(previousSlot.fechaCita ?? ''),
      previousHora: formatTimeShort(previousSlot.horaInicioCita),
      nota: nota || undefined,
    };
    const extra = `from:${formatDisplayDate(previousSlot.fechaCita ?? '')}-${formatTimeShort(previousSlot.horaInicioCita)}`;

    const idPaciente = reserva.usuario?.idUsuario;
    if (idPaciente) {
      const msg = this.buildMessage(
        reserva,
        NotificationType.CITA_REAGENDADA,
        'paciente',
      );
      await this.createIfNotExists({
        idUsuario: idPaciente,
        tipo: NotificationType.CITA_REAGENDADA,
        titulo: msg.titulo,
        mensaje: nota ? `${msg.mensaje} Mensaje: ${nota}` : msg.mensaje,
        idReservaPaciente: reserva.idReservaPaciente,
        metadata: {
          ...msg.metadata,
          previousFechaCita: previousSlot.fechaCita,
          previousHoraInicioCita: previousSlot.horaInicioCita,
          motivo: nota || null,
        },
        claveDedup: this.buildDedupKey(
          NotificationType.CITA_REAGENDADA,
          reserva.idReservaPaciente,
          idPaciente,
          extra,
        ),
      });
      await this.safeMail(() =>
        this.mailService.sendAppointmentRescheduled(
          this.patientEmail(reserva),
          mailCtx,
        ),
      );
    }

    const doctorUsuario = await this.resolveDoctorUsuario(reserva);
    if (doctorUsuario) {
      const msg = this.buildMessage(
        reserva,
        NotificationType.CITA_REAGENDADA,
        'doctor',
      );
      await this.createIfNotExists({
        idUsuario: doctorUsuario.idUsuario,
        tipo: NotificationType.CITA_REAGENDADA,
        titulo: msg.titulo,
        mensaje: nota ? `${msg.mensaje} Mensaje: ${nota}` : msg.mensaje,
        idReservaPaciente: reserva.idReservaPaciente,
        metadata: {
          ...msg.metadata,
          previousFechaCita: previousSlot.fechaCita,
          previousHoraInicioCita: previousSlot.horaInicioCita,
          motivo: nota || null,
        },
        claveDedup: this.buildDedupKey(
          NotificationType.CITA_REAGENDADA,
          reserva.idReservaPaciente,
          doctorUsuario.idUsuario,
          extra,
        ),
      });
      await this.safeMail(() =>
        this.mailService.sendAppointmentRescheduled(
          this.doctorEmail(reserva),
          mailCtx,
        ),
      );
    }
  }

  async notifyReminder24h(
    reserva: ReservaPaciente,
    recipientRole: 'paciente' | 'doctor',
    idUsuario: number,
  ): Promise<void> {
    if (!reserva.idReservaPaciente || !idUsuario) return;

    const msg = this.buildMessage(
      reserva,
      NotificationType.CITA_RECORDATORIO_24H,
      recipientRole,
    );
    const created = await this.createIfNotExists({
      idUsuario,
      tipo: NotificationType.CITA_RECORDATORIO_24H,
      titulo: msg.titulo,
      mensaje: msg.mensaje,
      idReservaPaciente: reserva.idReservaPaciente,
      metadata: msg.metadata,
      claveDedup: this.buildDedupKey(
        NotificationType.CITA_RECORDATORIO_24H,
        reserva.idReservaPaciente,
        idUsuario,
      ),
    });

    if (!created) return;

    const email =
      recipientRole === 'doctor'
        ? this.doctorEmail(reserva)
        : this.patientEmail(reserva);
    await this.safeMail(() =>
      this.mailService.sendReminder24h(
        email,
        this.toMailContext(reserva),
        recipientRole,
      ),
    );
  }

  private toMailContext(reserva: ReservaPaciente): AppointmentMailContext {
    return {
      pacienteNombre: getPersonaFullName(reserva.usuario?.persona),
      doctorNombre: getPersonaFullName(reserva.doctor?.persona),
      fecha: formatDisplayDate(reserva.fechaCita),
      hora: formatTimeShort(reserva.horaInicioCita),
      posta: reserva.posta?.nombre ?? 'Posta médica',
      especialidad: reserva.especialidad?.nombre ?? 'Consulta médica',
    };
  }

  private patientEmail(reserva: ReservaPaciente): string {
    return reserva.usuario?.persona?.email?.trim() ?? '';
  }

  private doctorEmail(reserva: ReservaPaciente): string {
    return reserva.doctor?.persona?.email?.trim() ?? '';
  }

  private async resolveDoctorUsuario(reserva: ReservaPaciente) {
    const idPersonaDoctor = reserva.doctor?.persona?.idPersona;
    if (!idPersonaDoctor) return null;
    const doctorUsuario =
      await this.usuariosService.findOneByPersona(idPersonaDoctor);
    if (!doctorUsuario || doctorUsuario.deletedAt) return null;
    return doctorUsuario;
  }

  private async safeMail(fn: () => Promise<boolean>): Promise<void> {
    try {
      await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Fallo al enviar correo de notificación: ${message}`);
    }
  }
}
