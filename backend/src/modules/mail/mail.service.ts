import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface AppointmentMailContext {
  pacienteNombre: string;
  doctorNombre: string;
  fecha: string;
  hora: string;
  posta: string;
  especialidad: string;
  cancelledByLabel?: string;
  previousFecha?: string;
  previousHora?: string;
  nota?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter(): void {
    const host = this.configService.get<string>('MAIL_HOST');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');
    const port = Number(this.configService.get<string>('MAIL_PORT') ?? 587);
    const secure =
      String(this.configService.get<string>('MAIL_SECURE') ?? 'false') ===
      'true';

    if (!host || !user || !pass) {
      this.logger.warn(
        'MailService: SMTP incompleto (MAIL_HOST/USER/PASS). Los envíos se omitirán.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass: pass.replace(/\s+/g, '') },
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 12_000,
    });
  }

  async sendMail(options: SendMailOptions): Promise<boolean> {
    const to = options.to?.trim();
    if (!to) {
      this.logger.warn(`Mail omitido (sin destinatario): ${options.subject}`);
      return false;
    }

    if (!this.transporter) {
      this.logger.warn(
        `Mail omitido (SMTP no configurado): ${options.subject} → ${to}`,
      );
      return false;
    }

    const from =
      this.configService.get<string>('MAIL_FROM') ||
      this.configService.get<string>('MAIL_USER') ||
      'MedPortal';

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      this.logger.log(`Correo enviado: ${options.subject} → ${to}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error enviando correo a ${to}: ${message}`);
      return false;
    }
  }

  async sendAppointmentCreatedToDoctor(
    to: string,
    ctx: AppointmentMailContext,
  ): Promise<boolean> {
    return this.sendMail({
      to,
      subject: `Nueva cita: ${ctx.pacienteNombre} — ${ctx.fecha} ${ctx.hora}`,
      html: this.wrapHtml(
        'Nueva reserva de cita',
        `<p><strong>${this.esc(ctx.pacienteNombre)}</strong> reservó una cita contigo.</p>
        ${this.appointmentDetails(ctx)}`,
      ),
      text: `${ctx.pacienteNombre} reservó una cita el ${ctx.fecha} a las ${ctx.hora} en ${ctx.posta} (${ctx.especialidad}).`,
    });
  }

  async sendAppointmentConfirmedToPatient(
    to: string,
    ctx: AppointmentMailContext,
  ): Promise<boolean> {
    return this.sendMail({
      to,
      subject: `Cita confirmada — ${ctx.fecha} ${ctx.hora}`,
      html: this.wrapHtml(
        'Cita confirmada',
        `<p>Tu cita con el Dr. <strong>${this.esc(ctx.doctorNombre)}</strong> quedó registrada.</p>
        ${this.appointmentDetails(ctx)}`,
      ),
      text: `Tu cita con Dr. ${ctx.doctorNombre} quedó registrada el ${ctx.fecha} a las ${ctx.hora} en ${ctx.posta} (${ctx.especialidad}).`,
    });
  }

  async sendReminder24h(
    to: string,
    ctx: AppointmentMailContext,
    recipientRole: 'paciente' | 'doctor',
  ): Promise<boolean> {
    const isDoctor = recipientRole === 'doctor';
    const subject = isDoctor
      ? `Recordatorio: consulta mañana con ${ctx.pacienteNombre}`
      : `Recordatorio: tu cita es mañana a las ${ctx.hora}`;
    const intro = isDoctor
      ? `<p>Tienes una consulta mañana con <strong>${this.esc(ctx.pacienteNombre)}</strong>.</p>`
      : `<p>Te recordamos que mañana tienes cita con el Dr. <strong>${this.esc(ctx.doctorNombre)}</strong>.</p>`;

    return this.sendMail({
      to,
      subject,
      html: this.wrapHtml('Recordatorio de cita (24 h)', `${intro}${this.appointmentDetails(ctx)}`),
      text: isDoctor
        ? `Consulta mañana con ${ctx.pacienteNombre} a las ${ctx.hora} en ${ctx.posta}.`
        : `Tu cita es mañana a las ${ctx.hora} con Dr. ${ctx.doctorNombre} en ${ctx.posta}.`,
    });
  }

  async sendAppointmentCancelled(
    to: string,
    ctx: AppointmentMailContext,
  ): Promise<boolean> {
    const by = ctx.cancelledByLabel ?? 'el sistema';
    const nota = ctx.nota
      ? `<p>Mensaje: ${this.esc(ctx.nota)}</p>`
      : '';
    return this.sendMail({
      to,
      subject: `Cita cancelada — ${ctx.fecha} ${ctx.hora}`,
      html: this.wrapHtml(
        'Cita cancelada',
        `<p>La siguiente cita fue cancelada por <strong>${this.esc(by)}</strong>.</p>
        ${nota}
        ${this.appointmentDetails(ctx)}`,
      ),
      text: `Cita cancelada por ${by}: ${ctx.fecha} ${ctx.hora} — ${ctx.pacienteNombre} / Dr. ${ctx.doctorNombre} en ${ctx.posta}.${ctx.nota ? ` Mensaje: ${ctx.nota}` : ''}`,
    });
  }

  async sendAppointmentRescheduled(
    to: string,
    ctx: AppointmentMailContext,
  ): Promise<boolean> {
    const prev =
      ctx.previousFecha && ctx.previousHora
        ? `<p>Horario anterior: <strong>${this.esc(ctx.previousFecha)}</strong> a las <strong>${this.esc(ctx.previousHora)}</strong>.</p>`
        : '';
    const nota = ctx.nota ? `<p>Mensaje: ${this.esc(ctx.nota)}</p>` : '';
    return this.sendMail({
      to,
      subject: `Cita reagendada — ${ctx.fecha} ${ctx.hora}`,
      html: this.wrapHtml(
        'Cita reagendada',
        `<p>Tu cita fue reagendada. Nuevo horario:</p>
        ${this.appointmentDetails(ctx)}
        ${prev}
        ${nota}`,
      ),
      text: `Cita reagendada. Nuevo: ${ctx.fecha} ${ctx.hora}. Anterior: ${ctx.previousFecha ?? ''} ${ctx.previousHora ?? ''}.${ctx.nota ? ` Mensaje: ${ctx.nota}` : ''}`,
    });
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<boolean> {
    return this.sendMail({
      to,
      subject: 'Recuperación de contraseña — MedPortal',
      html: this.wrapHtml(
        'Recuperación de contraseña',
        `<p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p><a href="${this.esc(resetUrl)}" style="display:inline-block;padding:12px 20px;background:#0d47a1;color:#fff;text-decoration:none;border-radius:8px;">Restablecer contraseña</a></p>
        <p style="color:#666;font-size:13px;">Si el botón no funciona, copia este enlace:<br/>${this.esc(resetUrl)}</p>
        <p style="color:#666;font-size:13px;">El enlace es de un solo uso y expira pronto. Si no solicitaste este cambio, ignora este correo.</p>`,
      ),
      text: `Restablece tu contraseña con este enlace (un solo uso): ${resetUrl}`,
    });
  }

  async sendPasswordResetToCi(
    to: string,
    opts: { nombre: string; username: string; wasReset: boolean },
  ): Promise<boolean> {
    const title = opts.wasReset
      ? 'Contraseña restablecida'
      : 'Cuenta de usuario creada';
    const intro = opts.wasReset
      ? '<p>Un administrador restableció tu contraseña de MedPortal.</p>'
      : '<p>Se creó tu cuenta de acceso a MedPortal.</p>';

    return this.sendMail({
      to,
      subject: `${title} — MedPortal`,
      html: this.wrapHtml(
        title,
        `${intro}
        <p>Hola <strong>${this.esc(opts.nombre || 'usuario')}</strong>, tus credenciales temporales son:</p>
        <ul>
          <li><strong>Usuario:</strong> ${this.esc(opts.username)}</li>
          <li><strong>Contraseña:</strong> tu número de CI (${this.esc(opts.username)})</li>
        </ul>
        <p>Por seguridad, cambia esta contraseña al iniciar sesión.</p>`,
      ),
      text: `${title}. Usuario: ${opts.username}. Contraseña temporal: tu CI (${opts.username}). Cámbiala al iniciar sesión.`,
    });
  }

  private appointmentDetails(ctx: AppointmentMailContext): string {
    return `<ul>
      <li><strong>Paciente:</strong> ${this.esc(ctx.pacienteNombre)}</li>
      <li><strong>Doctor:</strong> ${this.esc(ctx.doctorNombre)}</li>
      <li><strong>Fecha:</strong> ${this.esc(ctx.fecha)}</li>
      <li><strong>Hora:</strong> ${this.esc(ctx.hora)}</li>
      <li><strong>Posta:</strong> ${this.esc(ctx.posta)}</li>
      <li><strong>Especialidad:</strong> ${this.esc(ctx.especialidad)}</li>
    </ul>`;
  }

  private wrapHtml(title: string, body: string): string {
    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"/><title>${this.esc(title)}</title></head>
<body style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#222;max-width:560px;margin:0 auto;padding:24px;">
  <h1 style="font-size:20px;color:#0d47a1;">${this.esc(title)}</h1>
  ${body}
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
  <p style="font-size:12px;color:#888;">MedPortal — Facultad de Ciencias Puras y Naturales</p>
</body>
</html>`;
  }

  private esc(value: string): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
