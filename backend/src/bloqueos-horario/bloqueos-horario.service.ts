import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { BloqueoHorarioDoctor } from '../modules/appointments/entities/bloqueo-horario-doctor.entity';
import { ReservaPaciente } from '../modules/appointments/entities/reserva-paciente.entity';
import { AsignacionDoctorConsultorio } from '../modules/medical/entities/asignacion-doctor-consultorio.entity';
import { ConfiguracionReservaConsulta } from '../modules/appointments/entities/configuracion-reserva-consulta.entity';
import { Doctor } from '../modules/medical/entities/doctor.entity';
import { CreateBloqueoHorarioDto } from './dto/create-bloqueo-horario.dto';

@Injectable()
export class BloqueosHorarioService {
  constructor(
    @InjectRepository(BloqueoHorarioDoctor)
    private readonly bloqueoRepository: Repository<BloqueoHorarioDoctor>,
    @InjectRepository(ReservaPaciente)
    private readonly reservaRepository: Repository<ReservaPaciente>,
    @InjectRepository(AsignacionDoctorConsultorio)
    private readonly asignacionRepository: Repository<AsignacionDoctorConsultorio>,
    @InjectRepository(ConfiguracionReservaConsulta)
    private readonly configRepository: Repository<ConfiguracionReservaConsulta>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  private normalizeHora(hora: string): string {
    const parts = String(hora || '')
      .trim()
      .split(':')
      .map((p) => p.padStart(2, '0'));
    if (parts.length === 2) return `${parts[0]}:${parts[1]}:00`;
    if (parts.length >= 3) return `${parts[0]}:${parts[1]}:${parts[2]}`;
    return hora;
  }

  private toMinutes(hora: string): number {
    const [h, m] = this.normalizeHora(hora).split(':').map(Number);
    return h * 60 + m;
  }

  private slotsOverlap(
    aInicio: string,
    aFin: string,
    bInicio: string,
    bFin: string,
  ): boolean {
    const a0 = this.toMinutes(aInicio);
    const a1 = this.toMinutes(aFin);
    const b0 = this.toMinutes(bInicio);
    const b1 = this.toMinutes(bFin);
    return a0 < b1 && b0 < a1;
  }

  private normalizarDiaTexto(texto: string): string {
    return String(texto || '')
      .toUpperCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private extraerDiasAsignacion(diasSemana: string | null): string[] {
    if (!diasSemana) return [];
    return diasSemana
      .split(',')
      .map((dia) => this.normalizarDiaTexto(dia))
      .filter(Boolean);
  }

  private obtenerDiaSemana(fechaCita: string): string {
    const diasSemanaMap = [
      'DOMINGO',
      'LUNES',
      'MARTES',
      'MIERCOLES',
      'JUEVES',
      'VIERNES',
      'SABADO',
    ];
    const citaDate = new Date(fechaCita + 'T00:00:00');
    return diasSemanaMap[citaDate.getDay()];
  }

  private async resolveDoctorByPersona(idPersona: number) {
    const doctor = await this.doctorRepository.findOne({
      where: { persona: { idPersona } },
      relations: ['persona'],
    });
    if (!doctor) {
      throw new ForbiddenException(
        'Solo un doctor autenticado puede gestionar bloqueos de su agenda.',
      );
    }
    return doctor;
  }

  private async resolveAsignacionParaSlot(
    idDoctor: number,
    fecha: string,
    horaInicio: string,
    horaFin: string,
  ): Promise<AsignacionDoctorConsultorio> {
    const diaSemana = this.obtenerDiaSemana(fecha);
    const inicioMin = this.toMinutes(horaInicio);
    const finMin = this.toMinutes(horaFin);
    const duracionRecibida = finMin - inicioMin;

    if (duracionRecibida <= 0) {
      throw new BadRequestException(
        'La hora de fin debe ser posterior a la hora de inicio.',
      );
    }

    const asignaciones = await this.asignacionRepository.find({
      where: { doctor: { idDoctor }, activo: true },
    });

    const candidatas = asignaciones.filter((asignacion) => {
      if (!asignacion.horaInicio || !asignacion.horaFin) return false;
      const diasAsignacion = this.extraerDiasAsignacion(asignacion.diasSemana);
      if (diasAsignacion.length && !diasAsignacion.includes(diaSemana)) {
        return false;
      }
      const turnoInicio = this.toMinutes(
        this.normalizeHora(asignacion.horaInicio),
      );
      const turnoFin = this.toMinutes(this.normalizeHora(asignacion.horaFin));
      if (!(inicioMin >= turnoInicio && finMin <= turnoFin)) return false;

      const duracion = Number(asignacion.duracionCita);
      if (!Number.isFinite(duracion) || duracion <= 0) return false;
      if (duracion !== duracionRecibida) return false;

      // Slot alineado a la grilla del turno
      if ((inicioMin - turnoInicio) % duracion !== 0) return false;

      return true;
    });

    if (!candidatas.length) {
      throw new BadRequestException(
        'El horario no corresponde a un slot válido de tus turnos asignados.',
      );
    }

    return candidatas[0];
  }

  private async getCupoGlobalMinutos(): Promise<number> {
    const configs = await this.configRepository.find({
      order: { idConfiguracionReservasMedicas: 'DESC' },
      take: 1,
    });
    const config = configs[0];
    const horas = config?.horasLibresMensuales;
    if (horas == null || !Number.isFinite(Number(horas)) || Number(horas) <= 0) {
      return 0;
    }
    return Number(horas) * 60;
  }

  private getCupoEfectivoMinutos(
    asignacion: AsignacionDoctorConsultorio,
    cupoGlobalMinutos: number,
  ): number {
    if (
      asignacion.horasLibresMensuales != null &&
      Number.isFinite(Number(asignacion.horasLibresMensuales))
    ) {
      return Number(asignacion.horasLibresMensuales) * 60;
    }
    return cupoGlobalMinutos;
  }

  private mesRange(anio: number, mes: number): { desde: string; hasta: string } {
    const desde = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const lastDay = new Date(anio, mes, 0).getDate();
    const hasta = `${anio}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { desde, hasta };
  }

  async sumGastadasMinutos(
    idDoctor: number,
    anio: number,
    mes: number,
  ): Promise<number> {
    const { desde, hasta } = this.mesRange(anio, mes);
    const bloqueos = await this.bloqueoRepository.find({
      where: {
        doctor: { idDoctor },
        fecha: Between(desde as any, hasta as any),
      },
    });
    return bloqueos.reduce((acc, b) => {
      return acc + (this.toMinutes(b.horaFin) - this.toMinutes(b.horaInicio));
    }, 0);
  }

  async getCupoForDoctor(
    idDoctor: number,
    anio: number,
    mes: number,
    asignacion?: AsignacionDoctorConsultorio | null,
  ) {
    const cupoGlobalMinutos = await this.getCupoGlobalMinutos();
    let cupoMinutos = cupoGlobalMinutos;

    if (asignacion) {
      cupoMinutos = this.getCupoEfectivoMinutos(asignacion, cupoGlobalMinutos);
    } else {
      // Sin slot concreto: mostrar override de la primera asignación activa con valor, si existe
      const asignaciones = await this.asignacionRepository.find({
        where: { doctor: { idDoctor }, activo: true },
      });
      const conOverride = asignaciones.find(
        (a) =>
          a.horasLibresMensuales != null &&
          Number.isFinite(Number(a.horasLibresMensuales)),
      );
      if (conOverride) {
        cupoMinutos = Number(conOverride.horasLibresMensuales) * 60;
      }
    }

    const gastadasMinutos = await this.sumGastadasMinutos(idDoctor, anio, mes);
    const restantesMinutos = Math.max(0, cupoMinutos - gastadasMinutos);

    return {
      anio,
      mes,
      cupoMinutos,
      gastadasMinutos,
      restantesMinutos,
      cupoHoras: cupoMinutos / 60,
      gastadasHoras: gastadasMinutos / 60,
      restantesHoras: restantesMinutos / 60,
    };
  }

  async findByDoctorRange(idDoctor: number, desde?: string, hasta?: string) {
    const where: any = { doctor: { idDoctor } };
    if (desde && hasta) {
      where.fecha = Between(desde as any, hasta as any);
    } else if (desde) {
      where.fecha = Between(desde as any, '9999-12-31' as any);
    } else if (hasta) {
      where.fecha = Between('1970-01-01' as any, hasta as any);
    }

    return this.bloqueoRepository.find({
      where,
      relations: ['asignacion'],
      order: { fecha: 'ASC', horaInicio: 'ASC' },
    });
  }

  async findMios(idPersona: number, desde?: string, hasta?: string) {
    const doctor = await this.resolveDoctorByPersona(idPersona);
    return this.findByDoctorRange(doctor.idDoctor, desde, hasta);
  }

  async getCupoMios(idPersona: number, anio: number, mes: number) {
    const doctor = await this.resolveDoctorByPersona(idPersona);
    return this.getCupoForDoctor(doctor.idDoctor, anio, mes);
  }

  async create(idPersona: number, dto: CreateBloqueoHorarioDto) {
    const doctor = await this.resolveDoctorByPersona(idPersona);
    const fecha = dto.fecha;
    const horaInicio = this.normalizeHora(dto.horaInicio);
    const horaFin = this.normalizeHora(dto.horaFin);

    const manana = new Date();
    manana.setHours(0, 0, 0, 0);
    manana.setDate(manana.getDate() + 1);
    const minFecha = `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, '0')}-${String(manana.getDate()).padStart(2, '0')}`;
    if (String(fecha).slice(0, 10) < minFecha) {
      throw new BadRequestException(
        'Solo se pueden bloquear horarios de días futuros (a partir de mañana).',
      );
    }

    const asignacion = await this.resolveAsignacionParaSlot(
      doctor.idDoctor,
      fecha,
      horaInicio,
      horaFin,
    );

    const reservas = await this.reservaRepository.find({
      where: {
        doctor: { idDoctor: doctor.idDoctor },
        fechaCita: fecha as any,
        estado: In(['PENDIENTE', 'PRESENTE']),
      },
    });

    const conflictoReserva = reservas.find(
      (r) =>
        r.horaInicioCita &&
        r.horaFinCita &&
        this.slotsOverlap(
          horaInicio,
          horaFin,
          this.normalizeHora(r.horaInicioCita),
          this.normalizeHora(r.horaFinCita),
        ),
    );
    if (conflictoReserva) {
      throw new ConflictException(
        'No se puede bloquear: hay una reserva de paciente en ese horario. Cancela o reagenda primero.',
      );
    }

    const bloqueosExistentes = await this.bloqueoRepository.find({
      where: {
        doctor: { idDoctor: doctor.idDoctor },
        fecha: fecha as any,
      },
    });
    const conflictoBloqueo = bloqueosExistentes.find((b) =>
      this.slotsOverlap(
        horaInicio,
        horaFin,
        this.normalizeHora(b.horaInicio),
        this.normalizeHora(b.horaFin),
      ),
    );
    if (conflictoBloqueo) {
      throw new ConflictException('Ese horario ya está bloqueado.');
    }

    const citaDate = new Date(fecha + 'T00:00:00');
    const anio = citaDate.getFullYear();
    const mes = citaDate.getMonth() + 1;
    const cupoInfo = await this.getCupoForDoctor(
      doctor.idDoctor,
      anio,
      mes,
      asignacion,
    );
    const duracionSlot =
      this.toMinutes(horaFin) - this.toMinutes(horaInicio);

    if (cupoInfo.cupoMinutos <= 0) {
      throw new BadRequestException(
        'No hay cupo de horas libres configurado para bloqueos.',
      );
    }
    if (cupoInfo.gastadasMinutos + duracionSlot > cupoInfo.cupoMinutos) {
      throw new BadRequestException(
        `Cupo mensual insuficiente. Restan ${cupoInfo.restantesHoras} hora(s) libres este mes.`,
      );
    }

    const bloqueo = this.bloqueoRepository.create({
      doctor,
      asignacion,
      fecha: fecha as any,
      horaInicio,
      horaFin,
      descripcion: dto.descripcion?.trim() ? dto.descripcion.trim() : null,
    });

    try {
      return await this.bloqueoRepository.save(bloqueo);
    } catch (error: any) {
      if (
        error?.driverError?.constraint === 'UQ_bloqueo_doctor_fecha_hora' ||
        String(error?.message || '').includes('UQ_bloqueo_doctor_fecha_hora')
      ) {
        throw new ConflictException('Ese horario ya está bloqueado.');
      }
      throw error;
    }
  }

  async remove(idPersona: number, idBloqueo: number) {
    const doctor = await this.resolveDoctorByPersona(idPersona);
    const bloqueo = await this.bloqueoRepository.findOne({
      where: { idBloqueoHorario: idBloqueo },
      relations: ['doctor'],
    });

    if (!bloqueo) {
      throw new NotFoundException(`Bloqueo con ID ${idBloqueo} no encontrado.`);
    }
    if (bloqueo.doctor.idDoctor !== doctor.idDoctor) {
      throw new ForbiddenException(
        'Solo puedes eliminar bloqueos de tu propia agenda.',
      );
    }

    const fechaStr =
      typeof bloqueo.fecha === 'string'
        ? String(bloqueo.fecha).slice(0, 10)
        : new Date(bloqueo.fecha).toISOString().slice(0, 10);
    const inicio = new Date(
      `${fechaStr}T${this.normalizeHora(bloqueo.horaInicio)}`,
    );
    if (!(inicio.getTime() > Date.now())) {
      throw new BadRequestException(
        'Solo se pueden eliminar bloqueos futuros.',
      );
    }

    return this.bloqueoRepository.remove(bloqueo);
  }

  /** Usado por reservas-pacientes para rechazar solapes. */
  async assertSinBloqueoSolapado(
    idDoctor: number,
    fechaCita: string,
    horaInicio: string,
    horaFin: string,
  ): Promise<void> {
    const bloqueos = await this.bloqueoRepository.find({
      where: {
        doctor: { idDoctor },
        fecha: fechaCita as any,
      },
    });

    const conflicto = bloqueos.find((b) =>
      this.slotsOverlap(
        this.normalizeHora(horaInicio),
        this.normalizeHora(horaFin),
        this.normalizeHora(b.horaInicio),
        this.normalizeHora(b.horaFin),
      ),
    );

    if (conflicto) {
      throw new ConflictException(
        'El horario seleccionado no está disponible (bloqueado por el doctor).',
      );
    }
  }
}
