import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import { AsignacionDoctorConsultorio } from './entities/asignacion-doctor-consultorio.entity';
import { CreateAsignacionDoctorConsultorioDto } from './dto/create-asignacion-doctor-consultorio.dto';
import { Doctor } from './entities/doctor.entity';
import { ConsultorioEspecialidad } from './entities/consultorio-especialidad.entity';
import { EspecialidadMedica } from './entities/especialidad-medica.entity';
import { ReservaPaciente } from '../appointments/entities/reserva-paciente.entity';
import { sanitizeAsignacionDoctorPublico } from '../../doctores/doctor-public.util';

const ESTADOS_OCUPAN_AGENDA = ['PENDIENTE', 'PRESENTE', 'ATRASO'] as const;

@Injectable()
export class AsignacionDoctorConsultorioService {
  constructor(
    @InjectRepository(AsignacionDoctorConsultorio)
    private readonly asignacionRepository: Repository<AsignacionDoctorConsultorio>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(ConsultorioEspecialidad)
    private readonly consultorioRepository: Repository<ConsultorioEspecialidad>,
    @InjectRepository(EspecialidadMedica)
    private readonly especialidadRepository: Repository<EspecialidadMedica>,
    @InjectRepository(ReservaPaciente)
    private readonly reservaPacienteRepository: Repository<ReservaPaciente>,
  ) {}

  async create(
    createDto: CreateAsignacionDoctorConsultorioDto,
  ): Promise<AsignacionDoctorConsultorio> {
    const doctor = await this.doctorRepository.findOne({
      where: { idDoctor: createDto.idDoctor },
    });
    if (!doctor)
      throw new NotFoundException(
        `Doctor con ID ${createDto.idDoctor} no encontrado`,
      );

    const consultorio = await this.consultorioRepository.findOne({
      where: { idConsultorio: createDto.idConsultorio },
    });
    if (!consultorio)
      throw new NotFoundException(
        `Consultorio con ID ${createDto.idConsultorio} no encontrado`,
      );

    const especialidad = await this.especialidadRepository.findOne({
      where: { idEspecialidadMedica: createDto.idEspecialidad },
    });
    if (!especialidad)
      throw new NotFoundException(
        `Especialidad con ID ${createDto.idEspecialidad} no encontrada`,
      );

    const nuevaAsignacion = this.asignacionRepository.create({
      ...createDto,
      doctor,
      consultorio,
      especialidad,
      activo: true,
    });

    return await this.asignacionRepository.save(nuevaAsignacion);
  }

  async findAll(): Promise<AsignacionDoctorConsultorio[]> {
    const asignaciones = await this.asignacionRepository.find({
      relations: [
        'doctor',
        'doctor.persona',
        'consultorio',
        'consultorio.posta',
        'especialidad',
      ],
    });
    // Listado usado también por pacientes en Reservar: ocultar teléfono sin consentimiento
    return asignaciones.map((a) => sanitizeAsignacionDoctorPublico(a) as AsignacionDoctorConsultorio);
  }

  async findOne(id: number): Promise<AsignacionDoctorConsultorio> {
    const asignacion = await this.asignacionRepository.findOne({
      where: { idAsignacionDoctoresConsultorio: id },
      relations: [
        'doctor',
        'doctor.persona',
        'consultorio',
        'consultorio.posta',
        'especialidad',
      ],
    });

    if (!asignacion) {
      throw new NotFoundException(`Asignación con ID ${id} no encontrada`);
    }

    return asignacion;
  }

  async update(
    id: number,
    updateDto: Partial<CreateAsignacionDoctorConsultorioDto>,
  ): Promise<AsignacionDoctorConsultorio> {
    const asignacion = await this.findOne(id);

    if (updateDto.idDoctor) {
      const doctor = await this.doctorRepository.findOne({
        where: { idDoctor: updateDto.idDoctor },
      });
      if (!doctor)
        throw new NotFoundException(
          `Doctor con ID ${updateDto.idDoctor} no encontrado`,
        );
      asignacion.doctor = doctor;
    }

    if (updateDto.idConsultorio) {
      const consultorio = await this.consultorioRepository.findOne({
        where: { idConsultorio: updateDto.idConsultorio },
      });
      if (!consultorio)
        throw new NotFoundException(
          `Consultorio con ID ${updateDto.idConsultorio} no encontrado`,
        );
      asignacion.consultorio = consultorio;
    }

    if (updateDto.idEspecialidad) {
      const especialidad = await this.especialidadRepository.findOne({
        where: { idEspecialidadMedica: updateDto.idEspecialidad },
      });
      if (!especialidad)
        throw new NotFoundException(
          `Especialidad con ID ${updateDto.idEspecialidad} no encontrada`,
        );
      asignacion.especialidad = especialidad;
    }

    // Unmerge the IDs from the DTO to avoid conflicts with relations
    const { idDoctor, idConsultorio, idEspecialidad, ...rest } = updateDto;

    this.asignacionRepository.merge(asignacion, rest);
    return await this.asignacionRepository.save(asignacion);
  }

  async remove(id: number): Promise<AsignacionDoctorConsultorio> {
    const asignacion = await this.findOne(id);
    return await this.asignacionRepository.softRemove(asignacion);
  }

  /**
   * Citas futuras que quedarían fuera del nuevo horario/días del turno.
   * Solo considera citas que pertenecían a ESTE turno (horario anterior),
   * no las de otros turnos del mismo doctor (p. ej. tarde vs mañana).
   */
  async previsualizarImpacto(
    id: number,
    dto: {
      horaInicio?: string;
      horaFin?: string;
      diasSemana?: string;
    },
  ) {
    const asignacion = await this.findOne(id);
    const horaInicioNueva = this.normalizeHora(
      dto.horaInicio ?? asignacion.horaInicio,
    );
    const horaFinNueva = this.normalizeHora(dto.horaFin ?? asignacion.horaFin);
    const diasSemanaNuevos = dto.diasSemana ?? asignacion.diasSemana;

    const diasAnteriores = this.extraerDias(asignacion.diasSemana);
    const diasNuevos = this.extraerDias(diasSemanaNuevos);
    const turnoInicioAnterior = this.toMinutes(
      this.normalizeHora(asignacion.horaInicio),
    );
    const turnoFinAnterior = this.toMinutes(
      this.normalizeHora(asignacion.horaFin),
    );
    const turnoInicioNuevo = this.toMinutes(horaInicioNueva);
    const turnoFinNuevo = this.toMinutes(horaFinNueva);

    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    const ahoraMin =
      hoy.getHours() * 60 + hoy.getMinutes();

    const reservas = await this.reservaPacienteRepository.find({
      where: {
        doctor: { idDoctor: asignacion.doctor.idDoctor },
        estado: In([...ESTADOS_OCUPAN_AGENDA]),
        fechaCita: MoreThanOrEqual(hoyStr as any),
      },
      relations: ['usuario', 'usuario.persona'],
      order: { fechaCita: 'ASC', horaInicioCita: 'ASC' },
    });

    const afectadas = reservas.filter((r) => {
      if (!r.fechaCita || !r.horaInicioCita || !r.horaFinCita) return false;
      const fechaStr =
        typeof r.fechaCita === 'string'
          ? String(r.fechaCita).slice(0, 10)
          : new Date(r.fechaCita).toISOString().slice(0, 10);

      // Solo futuro real: hoy solo si la cita aún no empezó
      if (fechaStr === hoyStr) {
        const iniHoy = this.toMinutes(this.normalizeHora(r.horaInicioCita));
        if (iniHoy <= ahoraMin) return false;
      }

      const dia = this.diaSemanaDeFecha(fechaStr);
      const ini = this.toMinutes(this.normalizeHora(r.horaInicioCita));
      const fin = this.toMinutes(this.normalizeHora(r.horaFinCita));

      // Debe pertenecer al turno que se edita (encajaba en el horario/días ANTERIORES)
      const diaEnTurnoAnterior =
        !diasAnteriores.length || diasAnteriores.includes(dia);
      const horaEnTurnoAnterior =
        ini >= turnoInicioAnterior && fin <= turnoFinAnterior;
      if (!diaEnTurnoAnterior || !horaEnTurnoAnterior) return false;

      // Perjudicada si el día ya no está cubierto o el intervalo ya no cabe
      const diaEnTurnoNuevo = !diasNuevos.length || diasNuevos.includes(dia);
      const horaEnTurnoNuevo =
        ini >= turnoInicioNuevo && fin <= turnoFinNuevo;
      return !diaEnTurnoNuevo || !horaEnTurnoNuevo;
    });

    return {
      cantidad: afectadas.length,
      mensaje:
        afectadas.length > 0
          ? `Hay ${afectadas.length} cita(s) de este turno que quedan fuera del nuevo horario. Lo recomendable es reagendarlas.`
          : null,
      ids: afectadas.map((r) => r.idReservaPaciente),
    };
  }

  private normalizeHora(value?: string | null): string {
    if (!value) return '00:00:00';
    const parts = String(value).split(':');
    const h = parts[0]?.padStart(2, '0') || '00';
    const m = parts[1]?.padStart(2, '0') || '00';
    const s = (parts[2] || '00').padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  private toMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  private normalizarDia(texto: string): string {
    return texto
      .toUpperCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private extraerDias(diasSemana: string | null | undefined): string[] {
    if (!diasSemana) return [];
    return diasSemana
      .split(',')
      .map((d) => this.normalizarDia(d))
      .filter(Boolean);
  }

  private diaSemanaDeFecha(fechaCita: string): string {
    const dias = [
      'DOMINGO',
      'LUNES',
      'MARTES',
      'MIERCOLES',
      'JUEVES',
      'VIERNES',
      'SABADO',
    ];
    const d = new Date(fechaCita + 'T00:00:00');
    return dias[d.getDay()];
  }
}
