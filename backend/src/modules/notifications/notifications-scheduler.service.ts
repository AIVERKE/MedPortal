import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ReservaPaciente } from '../appointments/entities/reserva-paciente.entity';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './enums/notification-type.enum';
import { UsuariosService } from '../../usuarios/usuarios.service';
import {
  formatLaPazDateKey,
  normalizeDateStr,
  parseAppointmentDateTime,
  isWithinWindow,
} from './utils/notification-date.util';

@Injectable()
export class NotificationsSchedulerService {
  private readonly logger = new Logger(NotificationsSchedulerService.name);

  constructor(
    @InjectRepository(ReservaPaciente)
    private readonly reservaRepository: Repository<ReservaPaciente>,
    private readonly notificationsService: NotificationsService,
    private readonly usuariosService: UsuariosService,
    private readonly configService: ConfigService,
  ) {}

  private getWindowMinutes(): number {
    return (
      this.configService.get<number>('NOTIFICATION_POLL_WINDOW_MINUTES') ?? 15
    );
  }

  private async loadPendingReservas(): Promise<ReservaPaciente[]> {
    return this.reservaRepository.find({
      where: { estado: 'PENDIENTE' },
      relations: [
        'usuario',
        'usuario.persona',
        'doctor',
        'doctor.persona',
        'especialidad',
        'posta',
      ],
    });
  }

  @Cron('0 */15 * * * *')
  async processHourlyReminders(): Promise<void> {
    const windowMinutes = this.getWindowMinutes();
    const now = Date.now();
    const reservas = await this.loadPendingReservas();

    for (const reserva of reservas) {
      const appointmentMs = parseAppointmentDateTime(
        reserva.fechaCita,
        reserva.horaInicioCita,
      )?.getTime();
      if (!appointmentMs) continue;

      const idPaciente = reserva.usuario?.idUsuario;
      if (!idPaciente) continue;

      const reminder24hTarget = appointmentMs - 24 * 60 * 60 * 1000;
      if (isWithinWindow(reminder24hTarget, now, windowMinutes)) {
        await this.notificationsService.notifyReminder24h(
          reserva,
          'paciente',
          idPaciente,
        );

        const idPersonaDoctor = reserva.doctor?.persona?.idPersona;
        if (idPersonaDoctor) {
          const doctorUsuario =
            await this.usuariosService.findOneByPersona(idPersonaDoctor);
          if (doctorUsuario && !doctorUsuario.deletedAt) {
            await this.notificationsService.notifyReminder24h(
              reserva,
              'doctor',
              doctorUsuario.idUsuario,
            );
          }
        }
      }

      const reminder1hTarget = appointmentMs - 60 * 60 * 1000;
      if (isWithinWindow(reminder1hTarget, now, windowMinutes)) {
        const msgPaciente = this.notificationsService.buildMessage(
          reserva,
          NotificationType.CITA_RECORDATORIO_1H,
          'paciente',
        );
        await this.notificationsService.createIfNotExists({
          idUsuario: idPaciente,
          tipo: NotificationType.CITA_RECORDATORIO_1H,
          titulo: msgPaciente.titulo,
          mensaje: msgPaciente.mensaje,
          idReservaPaciente: reserva.idReservaPaciente,
          metadata: msgPaciente.metadata,
          claveDedup: this.notificationsService.buildDedupKey(
            NotificationType.CITA_RECORDATORIO_1H,
            reserva.idReservaPaciente,
            idPaciente,
          ),
        });

        const idPersonaDoctor = reserva.doctor?.persona?.idPersona;
        if (idPersonaDoctor) {
          const doctorUsuario =
            await this.usuariosService.findOneByPersona(idPersonaDoctor);
          if (doctorUsuario && !doctorUsuario.deletedAt) {
            const msgDoctor = this.notificationsService.buildMessage(
              reserva,
              NotificationType.CITA_RECORDATORIO_1H,
              'doctor',
            );
            await this.notificationsService.createIfNotExists({
              idUsuario: doctorUsuario.idUsuario,
              tipo: NotificationType.CITA_RECORDATORIO_1H,
              titulo: msgDoctor.titulo,
              mensaje: msgDoctor.mensaje,
              idReservaPaciente: reserva.idReservaPaciente,
              metadata: msgDoctor.metadata,
              claveDedup: this.notificationsService.buildDedupKey(
                NotificationType.CITA_RECORDATORIO_1H,
                reserva.idReservaPaciente,
                doctorUsuario.idUsuario,
              ),
            });
          }
        }
      }
    }

    this.logger.debug(
      `Procesados recordatorios 24h/1h para ${reservas.length} reservas pendientes`,
    );
  }

  @Cron('0 0 8 * * *', { timeZone: 'America/La_Paz' })
  async processMorningReminders(): Promise<void> {
    const fechaKey = formatLaPazDateKey();
    const reservas = await this.loadPendingReservas();
    const citasHoy = reservas.filter(
      (r) => normalizeDateStr(r.fechaCita) === fechaKey,
    );

    for (const reserva of citasHoy) {
      const idPaciente = reserva.usuario?.idUsuario;
      if (!idPaciente) continue;

      const msg = this.notificationsService.buildMessage(
        reserva,
        NotificationType.CITA_RECORDATORIO_DIA,
        'paciente',
      );
      await this.notificationsService.createIfNotExists({
        idUsuario: idPaciente,
        tipo: NotificationType.CITA_RECORDATORIO_DIA,
        titulo: msg.titulo,
        mensaje: msg.mensaje,
        idReservaPaciente: reserva.idReservaPaciente,
        metadata: msg.metadata,
        claveDedup: this.notificationsService.buildDedupKey(
          NotificationType.CITA_RECORDATORIO_DIA,
          reserva.idReservaPaciente,
          idPaciente,
        ),
      });
    }

    const porDoctor = new Map<number, ReservaPaciente[]>();
    for (const reserva of citasHoy) {
      const idDoctor = reserva.doctor?.idDoctor;
      if (!idDoctor) continue;
      const list = porDoctor.get(idDoctor) ?? [];
      list.push(reserva);
      porDoctor.set(idDoctor, list);
    }

    for (const [idDoctor, citas] of porDoctor) {
      const idPersonaDoctor = citas[0]?.doctor?.persona?.idPersona;
      if (!idPersonaDoctor) continue;

      const doctorUsuario =
        await this.usuariosService.findOneByPersona(idPersonaDoctor);
      if (!doctorUsuario || doctorUsuario.deletedAt) continue;

      const summary = this.notificationsService.buildDoctorDailySummary(
        citas.sort((a, b) =>
          (a.horaInicioCita ?? '').localeCompare(b.horaInicioCita ?? ''),
        ),
        fechaKey,
      );

      await this.notificationsService.createIfNotExists({
        idUsuario: doctorUsuario.idUsuario,
        tipo: NotificationType.DOCTOR_RESUMEN_DIARIO,
        titulo: summary.titulo,
        mensaje: summary.mensaje,
        metadata: summary.metadata,
        claveDedup: this.notificationsService.buildDedupKey(
          NotificationType.DOCTOR_RESUMEN_DIARIO,
          null,
          doctorUsuario.idUsuario,
          `${idDoctor}:${fechaKey}`,
        ),
      });
    }

    this.logger.log(
      `Recordatorios matutinos: ${citasHoy.length} citas, ${porDoctor.size} doctores`,
    );
  }

  /** Expuesto para pruebas manuales en desarrollo */
  async runAllRemindersNow(): Promise<void> {
    await this.processHourlyReminders();
    await this.processMorningReminders();
  }
}
