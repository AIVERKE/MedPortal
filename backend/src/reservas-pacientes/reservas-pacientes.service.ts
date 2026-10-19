import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Not,
  Repository,
  QueryFailedError,
  In,
  DataSource,
  EntityManager,
} from 'typeorm';
import { ReservaPaciente } from '../modules/appointments/entities/reserva-paciente.entity';
import { ReservaPacienteCancelada } from '../modules/appointments/entities/reserva-paciente-canceladas.entity';
import { UsersService } from '../modules/users/users.service';
import { EspecialidadMedicaService } from '../especialidad-medica/especialidad-medica.service';
import { PostasMedicasService } from '../postas-medicas/postas-medicas.service';
import { ConfiguracionReservasConsultasService } from '../configuracion_reservas_consultas/configuracion_reservas_consultas.service';
import { FechaCierreService } from '../fecha_cierre/fecha_cierre.service';
import { CreateReservaPacienteDto } from './dto/create-reserva-paciente.dto';
import { AtenderReservaDto } from './dto/atender-reserva.dto';
import { CreateConsultaSinReservaDto } from './dto/create-consulta-sin-reserva.dto';
import { ReagendarReservaDto } from './dto/reagendar-reserva.dto';
import { Usuario } from '../modules/users/entities/usuario.entity';
import { DoctoresService } from '../doctores/doctores.service';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { AsignacionDoctorConsultorio } from '../modules/medical/entities/asignacion-doctor-consultorio.entity';
import { BloqueosHorarioService } from '../bloqueos-horario/bloqueos-horario.service';

/** Estados que siguen ocupando cupo (solape / exclusion constraint). */
const ESTADOS_OCUPAN_AGENDA = ['PENDIENTE', 'PRESENTE', 'ATRASO'] as const;

@Injectable()
export class ReservasPacientesService {
  private readonly logger = new Logger(ReservasPacientesService.name);

  constructor(
    @InjectRepository(ReservaPaciente)
    private readonly reservaPacienteRepository: Repository<ReservaPaciente>,
    @InjectRepository(ReservaPacienteCancelada)
    private readonly reservaPacienteCanceladaRepository: Repository<ReservaPacienteCancelada>,
    @InjectRepository(AsignacionDoctorConsultorio)
    private readonly asignacionDoctorConsultorioRepository: Repository<AsignacionDoctorConsultorio>,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly especialidadService: EspecialidadMedicaService,
    private readonly postasService: PostasMedicasService,
    private readonly configService: ConfiguracionReservasConsultasService,
    private readonly fechaCierreService: FechaCierreService,
    private readonly doctoresService: DoctoresService,
    private readonly notificationsService: NotificationsService,
    private readonly bloqueosHorarioService: BloqueosHorarioService,
  ) { }

  async create(
    data: CreateReservaPacienteDto,
    idUsuario: number,
    options?: { omitirPoliticaReservas?: boolean },
  ) {
    const usuario = await this.usersService.findOneById(idUsuario);
    if (!usuario)
      throw new NotFoundException(`Usuario con ID ${idUsuario} no encontrado.`);

    const especialidad = await this.especialidadService.findOne(
      data.idEspecialidad,
    );
    if (!especialidad)
      throw new NotFoundException(
        `Especialidad con ID ${data.idEspecialidad} no encontrada.`,
      );

    const posta = await this.postasService.findOne(data.idPosta);
    if (!posta)
      throw new NotFoundException(
        'Posta médica no encontrada. No se puede agendar la cita.',
      );

    const doctor = await this.doctoresService.findOne(data.idDoctor);
    if (!doctor)
      throw new NotFoundException(
        `Doctor con ID ${data.idDoctor} no encontrado.`,
      );

    const horaInicioNormalizada = this.normalizeHora(data.horaInicioCita);
    const horaFinNormalizada = this.normalizeHora(data.horaFinCita);
    await this.assertHorarioDentroTurnosHabilitados(
      doctor.idDoctor,
      data.fechaCita,
      horaInicioNormalizada,
      horaFinNormalizada,
    );

    const omitirPoliticaReservas = options?.omitirPoliticaReservas === true;

    // 2. Validar Fecha de Cierre (Feriados, etc.) — solo aplica a pacientes
    if (!omitirPoliticaReservas) {
      const fechasCierre = await this.fechaCierreService.findAll();
      // data.fechaCita viene como string YYYY-MM-DD.
      // fechasCierre.fecha viene como Date o string dependiendo del driver.
      const isClosed = fechasCierre.some((cierre) => {
        // Convertir ambos a string YYYY-MM-DD para comparar
        const cierreStr = new Date(cierre.fecha).toISOString().split('T')[0];
        const citaStr = new Date(data.fechaCita).toISOString().split('T')[0];
        return cierreStr === citaStr;
      });

      if (isClosed) {
        throw new BadRequestException(
          'No se pueden realizar reservas en la fecha seleccionada por cierre administrativo.',
        );
      }
    }

    // 3. Validar Configuraciones — solo aplica a pacientes
    if (!omitirPoliticaReservas) {
      const configs = await this.configService.findAll();
      if (!configs || configs.length === 0) {
        throw new BadRequestException(
          'No hay configuraciones de reserva activas.',
        );
      }
      const config = configs[0];

      // 3.1 Días Semana
      const diasSemanaMap = [
        'domingo',
        'lunes',
        'martes',
        'miércoles',
        'jueves',
        'viernes',
        'sábado',
      ];
      const citaDate = new Date(data.fechaCita + 'T00:00:00'); // Forzar hora local/media noche para obtener día correcto
      const diaCita = diasSemanaMap[citaDate.getDay()];

      // Normalizar texto de configuración (ej: "Lunes, Miércoles")
      // Asumimos que viene separado por comas o es texto libre.
      const diasPermitidos = config.diasSemana.toLowerCase();

      if (!diasPermitidos.includes(diaCita)) {
        throw new BadRequestException(
          `El día ${diaCita} no está habilitado para reservas. Días permitidos: ${config.diasSemana}`,
        );
      }

      // 3.2 Horarios
      // Obtener la hora actual del servidor en formato HH:mm:ss
      const ahora = new Date();
      const horaActual = ahora.toTimeString().split(' ')[0]; // Ejemplo: "09:30:00"

      if (
        horaActual < config.horaInicioReserva ||
        horaActual > config.horaFinReserva
      ) {
        throw new BadRequestException(
          `El horario para realizar reservas (conectarse al sistema) es entre ${config.horaInicioReserva} y ${config.horaFinReserva}. Actualmente son las ${horaActual}.`,
        );
      }
    }

    await this.bloqueosHorarioService.assertSinBloqueoSolapado(
      doctor.idDoctor,
      data.fechaCita,
      horaInicioNormalizada,
      horaFinNormalizada,
    );

    // 4. Guardar bajo lock de doctor/paciente+día para evitar carreras de solape
    try {
      const savedReserva = await this.dataSource.transaction(async (manager) => {
        await this.acquireAgendaLocks(
          manager,
          doctor.idDoctor,
          idUsuario,
          data.fechaCita,
        );

        await this.assertSinSolapamientoReserva(
          {
            idUsuario,
            idDoctor: doctor.idDoctor,
            fechaCita: data.fechaCita,
            horaInicio: horaInicioNormalizada,
            horaFin: horaFinNormalizada,
          },
          manager,
        );

        const newReserva = manager.create(ReservaPaciente, {
          ...data,
          horaInicioCita: horaInicioNormalizada,
          horaFinCita: horaFinNormalizada,
          usuario,
          especialidad,
          posta,
          doctor,
          fechaSolicitud: new Date(),
          estado: 'PENDIENTE',
        });

        return manager.save(ReservaPaciente, newReserva);
      });

      // No notificar dentro de una TX abierta: el INSERT a notificaciones
      // (otra conexión) espera el commit y provoca deadlock.
      this.enqueueNotification(() =>
        this.notificationsService.notifyReservationCreated(savedReserva),
      );
      return savedReserva;
    } catch (error) {
      this.handleReservaConflictError(error);
    }
  }

  async createConsultaSinReserva(data: CreateConsultaSinReservaDto) {
    const usuario = await this.usersService.findOneById(data.idUsuario);
    if (!usuario)
      throw new NotFoundException(
        `Usuario con ID ${data.idUsuario} no encontrado.`,
      );

    const especialidad = await this.especialidadService.findOne(
      data.idEspecialidad,
    );
    if (!especialidad)
      throw new NotFoundException(
        `Especialidad con ID ${data.idEspecialidad} no encontrada.`,
      );

    const posta = await this.postasService.findOne(data.idPosta);
    if (!posta)
      throw new NotFoundException(
        'Posta médica no encontrada. No se puede atender la cita.',
      );

    const doctor = await this.doctoresService.findOneByPersona(data.idPersona);

    const ahora = new Date();
    const fechaAtendido = data.fechaAtendido;
    const horaAtendido = this.normalizeHora(data.horaAtendido);
    const horaFinCita = this.normalizeHora(data.horaFinCita);

    // Consulta sin reserva: se registran hora de inicio y fin de la atención.
    // horaInicioCita se deja NULL para no chocar con el UNIQUE de agenda formal.
    const newReserva = this.reservaPacienteRepository.create({
      usuario,
      especialidad,
      posta,
      doctor,
      observaciones: data.observaciones,
      fechaSolicitud: ahora,
      fechaCita: fechaAtendido, // Misma fecha de atención como referencia
      horaInicioCita: null,
      horaFinCita,
      estado: 'A-SIN-RESERVA',
      fechaAtendido,
      horaAtendido,
    });

    try {
      return await this.reservaPacienteRepository.save(newReserva);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new BadRequestException(
          `Error al registrar la consulta sin reserva: ${error.message}`,
        );
      }
      throw error;
    }
  }

  async findAll() {
    return await this.reservaPacienteRepository.find({
      relations: [
        'usuario',
        'especialidad',
        'posta',
        'doctor',
        'doctor.persona',
      ],
    });
  }

  async findOne(id: number) {
    const reserva = await this.reservaPacienteRepository.findOne({
      where: { idReservaPaciente: id },
      relations: [
        'usuario',
        'usuario.persona',
        'especialidad',
        'posta',
        'doctor',
        'doctor.persona',
      ],
    });
    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada.`);
    }
    return reserva;
  }

  async findByPostaAndEspecialidad(
    idPosta: number,
    idEspecialidadMedica: number,
  ) {
    return await this.reservaPacienteRepository.find({
      where: {
        posta: { idPosta: idPosta },
        especialidad: { idEspecialidadMedica: idEspecialidadMedica },
        estado: Not('CANCELADA'),
      },
      order: {
        fechaCita: 'ASC',
        horaInicioCita: 'ASC',
      },
      relations: [
        'usuario',
        'especialidad',
        'posta',
        'doctor',
        'doctor.persona',
      ],
    });
  }

  async findByPersonaId(idPersona: number) {
    const reservas = await this.reservaPacienteRepository.find({
      where: {
        doctor: { persona: { idPersona: idPersona } },
      },
      relations: [
        'usuario',
        'usuario.persona',
        'usuario.persona.estudiante',
        'usuario.persona.docente',
        'usuario.persona.administrativo',
        'usuario.persona.consultor',
        'usuario.persona.consultor.contratos',
        'usuario.persona.asignacionesRoles',
        'usuario.persona.asignacionesRoles.rol',
        'especialidad',
        'posta',
        'doctor',
        'doctor.persona',
      ],
    });

    if (reservas.length === 0) {
      return {
        message: `No se encontraron reservas para el doctor con ID de persona ${idPersona}`,
        data: [],
      };
    }

    // Remueve la contraseña por seguridad
    reservas.forEach((reserva) => {
      if (reserva.usuario && (reserva.usuario as any).password) {
        delete (reserva.usuario as any).password;
      }
    });

    return {
      message: 'Operación exitosa',
      data: reservas,
    };
  }

  async findByUserId(idUsuario: number) {
    const usuario = await this.usersService.findOneById(idUsuario);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${idUsuario} no encontrado.`);
    }

    const reservasActivas = await this.reservaPacienteRepository.find({
      where: {
        usuario: { idUsuario: idUsuario },
      },
      relations: [
        'doctor',
        'doctor.persona',
        'especialidad',
        'posta',
        'consulta',
      ],
    });

    const reservasCanceladas =
      await this.reservaPacienteCanceladaRepository.find({
        where: {
          usuario: { idUsuario: idUsuario },
        },
        relations: ['doctor', 'doctor.persona', 'especialidad', 'posta'],
      });

    const todasLasReservas = [...reservasActivas, ...reservasCanceladas].sort(
      (a, b) => {
        const dateA = new Date(a.fechaCita || '').getTime();
        const dateB = new Date(b.fechaCita || '').getTime();
        if (dateA !== dateB) return dateB - dateA;
        const horaA = a.horaInicioCita || '';
        const horaB = b.horaInicioCita || '';
        if (horaA > horaB) return -1;
        if (horaA < horaB) return 1;
        return 0;
      },
    );

    if (todasLasReservas.length === 0) {
      return {
        message: `No se encontraron reservas para el usuario con ID ${idUsuario}`,
        data: [],
      };
    }
    return {
      message: 'Operación exitosa',
      data: todasLasReservas,
    };
  }

  async findScheduledByUserId(idUsuario: number) {
    const usuario = await this.usersService.findOneById(idUsuario);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${idUsuario} no encontrado.`);
    }

    const reservas = await this.reservaPacienteRepository.find({
      where: {
        usuario: { idUsuario: idUsuario },
        estado: 'PENDIENTE',
      },
      relations: ['doctor', 'doctor.persona', 'especialidad', 'posta'],
      order: {
        fechaCita: 'ASC',
        horaInicioCita: 'ASC',
      },
    });

    if (reservas.length === 0) {
      return {
        message: `No se encontraron reservas programadas para el usuario con ID ${idUsuario}`,
        data: [],
      };
    }
    return {
      message: 'Operación exitosa',
      data: reservas,
    };
  }

  async findNearestPendingByUserId(idUsuario: number) {
    const usuario = await this.usersService.findOneById(idUsuario);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${idUsuario} no encontrado.`);
    }

    const reserva = await this.reservaPacienteRepository.findOne({
      where: {
        usuario: { idUsuario: idUsuario },
        estado: 'PENDIENTE',
      },
      relations: ['doctor', 'doctor.persona', 'especialidad', 'posta'],
      order: {
        fechaCita: 'ASC',
        horaInicioCita: 'ASC',
      },
    });

    if (!reserva) {
      return {
        message: `No se encontró una reserva pendiente próxima para el usuario con ID ${idUsuario}`,
        data: null,
      };
    }
    return {
      message: 'Operación exitosa',
      data: reserva,
    };
  }

  async findByUserAndDate(idUsuario: number, fecha: string) {
    const usuario = await this.usersService.findOneById(idUsuario);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${idUsuario} no encontrado.`);
    }

    const reservasActivas = await this.reservaPacienteRepository.find({
      where: {
        usuario: { idUsuario: idUsuario },
        fechaCita: fecha as any,
      },
      relations: ['doctor', 'doctor.persona', 'especialidad', 'posta'],
    });

    const reservasCanceladas =
      await this.reservaPacienteCanceladaRepository.find({
        where: {
          usuario: { idUsuario: idUsuario },
          fechaCita: fecha as any,
        },
        relations: ['doctor', 'doctor.persona', 'especialidad', 'posta'],
      });

    const todasLasReservas = [...reservasActivas, ...reservasCanceladas].sort(
      (a, b) => {
        const horaA = a.horaInicioCita || '';
        const horaB = b.horaInicioCita || '';
        if (horaA > horaB) return 1;
        if (horaA < horaB) return -1;
        return 0;
      },
    );

    if (todasLasReservas.length === 0) {
      return {
        message: `No se encontraron reservas para el usuario con ID ${idUsuario} en la fecha ${fecha}`,
        data: [],
      };
    }

    return {
      message: 'Operación exitosa',
      data: todasLasReservas,
    };
  }

  async update(id: number, data: Partial<CreateReservaPacienteDto>) {
    const reserva = await this.findOne(id);
    // Aquí se debería repetir validaciones si cambian fecha/hora, por brevedad actualizamos campos.
    this.reservaPacienteRepository.merge(reserva, data as any);
    return await this.reservaPacienteRepository.save(reserva);
  }

  private assertDoctorOwnership(
    reserva: ReservaPaciente,
    idPersonaDoctor?: number,
    rol?: string,
  ) {
    if (!idPersonaDoctor || rol !== 'DOCTOR') return;

    const doctorPersonaId = reserva.doctor?.persona?.idPersona;
    if (doctorPersonaId !== idPersonaDoctor) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta reserva.',
      );
    }
  }

  private esRolConAgendaLibre(rol?: string): boolean {
    const normalized = String(rol || '').toUpperCase();
    return normalized === 'DOCTOR' || normalized === 'SUPERUSUARIO';
  }

  private normalizeHora(hora: string | null): string {
    if (!hora) return '';
    const parts = hora.split(':');
    if (parts.length === 2) return `${hora}:00`;
    return hora;
  }

  private async validateFechaHabil(fechaCita: string) {
    const fechasCierre = await this.fechaCierreService.findAll();
    const isClosed = fechasCierre.some((cierre) => {
      const cierreStr = new Date(cierre.fecha).toISOString().split('T')[0];
      const citaStr = new Date(fechaCita).toISOString().split('T')[0];
      return cierreStr === citaStr;
    });

    if (isClosed) {
      throw new BadRequestException(
        'No se pueden programar citas en la fecha seleccionada por cierre administrativo.',
      );
    }

    const configs = await this.configService.findAll();
    if (!configs || configs.length === 0) {
      throw new BadRequestException(
        'No hay configuraciones de reserva activas.',
      );
    }
    const config = configs[0];

    const diasSemanaMap = [
      'domingo',
      'lunes',
      'martes',
      'miércoles',
      'jueves',
      'viernes',
      'sábado',
    ];
    const citaDate = new Date(fechaCita + 'T00:00:00');
    const diaCita = diasSemanaMap[citaDate.getDay()];
    const diasPermitidos = config.diasSemana.toLowerCase();

    if (!diasPermitidos.includes(diaCita)) {
      throw new BadRequestException(
        `El día ${diaCita} no está habilitado para citas. Días permitidos: ${config.diasSemana}`,
      );
    }
  }

  private handleReservaConflictError(error: unknown): never {
    if (error instanceof ConflictException || error instanceof BadRequestException) {
      throw error;
    }
    if (error instanceof NotFoundException || error instanceof ForbiddenException) {
      throw error;
    }
    if (error instanceof QueryFailedError) {
      const errorMessage = error.message.toLowerCase();
      const constraint = (error as any).driverError?.constraint as
        | string
        | undefined;

      if (
        errorMessage.includes('uq_cita_paciente') ||
        constraint === 'uq_cita_paciente' ||
        constraint === 'excl_paciente_reserva_solape'
      ) {
        throw new ConflictException({
          message:
            'El paciente ya tiene una cita programada que se solapa con este horario.',
        });
      }

      if (
        errorMessage.includes('uq_doctor_disponibilidad') ||
        constraint === 'uq_doctor_disponibilidad' ||
        constraint === 'excl_doctor_reserva_solape'
      ) {
        throw new ConflictException(
          'El horario seleccionado para este doctor se solapa con otra cita existente.',
        );
      }
    }
    throw error as Error;
  }

  /** Locks transaccionales por doctor/día y paciente/día (evita carreras de solape). */
  private async acquireAgendaLocks(
    manager: EntityManager,
    idDoctor: number,
    idUsuario: number,
    fechaCita: string,
  ): Promise<void> {
    // namespace 1 = doctor, 2 = paciente
    await manager.query(
      `SELECT pg_advisory_xact_lock(1, hashtext($1::text))`,
      [`${idDoctor}:${fechaCita}`],
    );
    await manager.query(
      `SELECT pg_advisory_xact_lock(2, hashtext($1::text))`,
      [`${idUsuario}:${fechaCita}`],
    );
  }

  private normalizarDiaTexto(texto: string): string {
    return texto
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

  private async assertHorarioDentroTurnosHabilitados(
    idDoctor: number,
    fechaCita: string,
    horaInicioCita: string,
    horaFinCita: string,
  ) {
    const diaSemana = this.obtenerDiaSemana(fechaCita);
    const inicioMin = this.toMinutes(horaInicioCita);
    const finMin = this.toMinutes(horaFinCita);
    const duracionRecibida = finMin - inicioMin;

    const asignaciones = await this.asignacionDoctorConsultorioRepository.find({
      where: {
        doctor: { idDoctor },
        activo: true,
      },
      relations: ['doctor'],
    });

    const turnosEnHorario = asignaciones.filter((asignacion) => {
      if (!asignacion.horaInicio || !asignacion.horaFin) return false;
      const diasAsignacion = this.extraerDiasAsignacion(asignacion.diasSemana);
      if (diasAsignacion.length && !diasAsignacion.includes(diaSemana)) {
        return false;
      }
      const turnoInicio = this.toMinutes(this.normalizeHora(asignacion.horaInicio));
      const turnoFin = this.toMinutes(this.normalizeHora(asignacion.horaFin));
      return inicioMin >= turnoInicio && finMin <= turnoFin;
    });

    if (!turnosEnHorario.length) {
      throw new BadRequestException(
        'La cita está fuera de los turnos habilitados del doctor para ese día.',
      );
    }

    const turnosConDuracion = turnosEnHorario.filter((asignacion) => {
      const duracionAsig = Number(asignacion.duracionCita);
      return Number.isFinite(duracionAsig) && duracionAsig > 0;
    });

    if (turnosConDuracion.length) {
      const coincide = turnosConDuracion.some(
        (asignacion) => Number(asignacion.duracionCita) === duracionRecibida,
      );
      if (!coincide) {
        const duraciones = [
          ...new Set(turnosConDuracion.map((a) => Number(a.duracionCita))),
        ];
        throw new BadRequestException(
          `La duración de la cita debe ser de ${duraciones.join(' o ')} minutos según el turno del doctor.`,
        );
      }
    }
  }

  async reagendar(
    id: number,
    data: ReagendarReservaDto,
    idPersonaDoctor?: number,
    rol?: string,
  ) {
    const reserva = await this.findOne(id);

    if (reserva.estado !== 'PENDIENTE') {
      throw new BadRequestException(
        'Solo se pueden reagendar citas en estado PENDIENTE.',
      );
    }

    this.assertDoctorOwnership(reserva, idPersonaDoctor, rol);
    if (!this.esRolConAgendaLibre(rol)) {
      await this.validateFechaHabil(data.fechaCita);
    }

    const horaInicio = this.normalizeHora(data.horaInicioCita);
    const horaFin = this.normalizeHora(data.horaFinCita);
    await this.assertHorarioDentroTurnosHabilitados(
      reserva.doctor.idDoctor,
      data.fechaCita,
      horaInicio,
      horaFin,
    );
    const idUsuario = reserva.usuario.idUsuario;
    const idDoctor = reserva.doctor.idDoctor;

    await this.bloqueosHorarioService.assertSinBloqueoSolapado(
      idDoctor,
      data.fechaCita,
      horaInicio,
      horaFin,
    );

    const previousSlot = {
      fechaCita: reserva.fechaCita,
      horaInicioCita: reserva.horaInicioCita,
    };

    try {
      const saved = await this.dataSource.transaction(async (manager) => {
        await this.acquireAgendaLocks(manager, idDoctor, idUsuario, data.fechaCita);

        await this.assertSinSolapamientoReserva(
          {
            idUsuario,
            idDoctor,
            fechaCita: data.fechaCita,
            horaInicio,
            horaFin,
            excludeReservaId: id,
          },
          manager,
        );

        const reservaLocked = await manager.findOne(ReservaPaciente, {
          where: { idReservaPaciente: id },
          relations: [
            'usuario',
            'especialidad',
            'posta',
            'doctor',
            'doctor.persona',
          ],
        });
        if (!reservaLocked) {
          throw new NotFoundException(`Reserva con ID ${id} no encontrada.`);
        }

        reservaLocked.fechaCita = data.fechaCita as any;
        reservaLocked.horaInicioCita = horaInicio;
        reservaLocked.horaFinCita = horaFin;
        reservaLocked.motivoReagendacion = this.normalizarMensaje(data.motivo);

        return manager.save(ReservaPaciente, reservaLocked);
      });

      this.enqueueNotification(() =>
        this.notificationsService.notifyReservationRescheduled(
          saved,
          previousSlot,
        ),
      );
      return saved;
    } catch (error) {
      this.handleReservaConflictError(error);
    }
  }

  async cancel(
    id: number,
    idPersonaDoctor?: number,
    rol?: string,
    motivo?: string,
    idUsuarioActor?: number,
  ) {
    const reserva = await this.findOne(id);
    if (reserva.estado === 'CANCELADA') {
      throw new BadRequestException('La reserva ya ha sido cancelada.');
    }

    const cancelledBy = rol === 'DOCTOR' ? 'doctor' : 'paciente';

    if (rol === 'DOCTOR') {
      if (reserva.estado !== 'PENDIENTE') {
        throw new BadRequestException(
          'Solo se pueden cancelar citas en estado PENDIENTE.',
        );
      }
      this.assertDoctorOwnership(reserva, idPersonaDoctor, rol);
    } else if (reserva.usuario?.idUsuario !== idUsuarioActor) {
      throw new ForbiddenException('No puedes cancelar esta cita.');
    }

    const motivoPersonalizado = this.normalizarMensaje(motivo);
    const quien =
      cancelledBy === 'doctor'
        ? 'Cancelado por el doctor'
        : 'Cancelado por el paciente';
    const motivoFinal = motivoPersonalizado
      ? `${quien}. ${motivoPersonalizado}`
      : quien;

    const reservaCancelada = this.reservaPacienteCanceladaRepository.create({
      usuario: reserva.usuario,
      especialidad: reserva.especialidad,
      posta: reserva.posta,
      doctor: reserva.doctor,
      fechaCita: reserva.fechaCita,
      horaInicioCita: reserva.horaInicioCita,
      horaFinCita: reserva.horaFinCita,
      fechaSolicitud: reserva.fechaSolicitud,
      fechaCancelacionCita: new Date(),
      motivoCancelacion: motivoFinal,
      observaciones: reserva.observaciones,
      estado: 'CANCELADA',
    });

    await this.detachNotificationsAndDeleteReserva(id);
    const savedCancelada =
      await this.reservaPacienteCanceladaRepository.save(reservaCancelada);

    this.enqueueNotification(() =>
      this.notificationsService.notifyReservationCancelled(
        reserva,
        cancelledBy,
        motivoPersonalizado,
      ),
    );

    return savedCancelada;
  }

  private normalizarMensaje(mensaje?: string | null): string | null {
    const texto = typeof mensaje === 'string' ? mensaje.trim() : '';
    if (!texto) return null;
    if (texto.length > 1000) {
      throw new BadRequestException(
        'El mensaje no puede superar los 1000 caracteres.',
      );
    }
    return texto;
  }

  async markAsPresent(id: number) {
    const reserva = await this.findOne(id);
    if (reserva.estado === 'CANCELADA') {
      throw new BadRequestException(
        'No se puede marcar como presente una reserva cancelada.',
      );
    }

    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const fechaLlegada = `${año}-${mes}-${dia}`;
    const horaLlegada = ahora.toTimeString().split(' ')[0];

    // Validate fechaLlegada matches reserva fechaCita
    // Depending on DB, fechaCita might be a Date object or string.
    // Convert to YYYY-MM-DD string to safely compare
    const citaStr =
      reserva.fechaCita instanceof Date
        ? reserva.fechaCita.toISOString().split('T')[0]
        : String(reserva.fechaCita).split('T')[0];

    if (fechaLlegada !== citaStr) {
      throw new BadRequestException(
        `La fecha actual del servidor (${fechaLlegada}) no coincide con la fecha de la cita (${citaStr}).`,
      );
    }

    if (reserva.estado === 'A-SIN-RESERVA') {
      throw new BadRequestException(
        'Esta es una consulta sin reserva, ya está marcada como presente/atendida.',
      );
    }

    const llegadaMin = this.toMinutes(horaLlegada);
    const inicioMin = this.toMinutes(reserva.horaInicioCita);
    const finMin = this.toMinutes(reserva.horaFinCita);

    if (llegadaMin < inicioMin || llegadaMin > finMin) {
      throw new BadRequestException(
        `La hora actual (${horaLlegada}) está fuera del horario de la cita (${reserva.horaInicioCita} - ${reserva.horaFinCita}).`,
      );
    }

    reserva.estado = 'PRESENTE';
    return await this.reservaPacienteRepository.save(reserva);
  }

  async markAsAbandoned(id: number) {
    const reserva = await this.findOne(id);
    if (reserva.estado === 'CANCELADA') {
      throw new BadRequestException(
        'No se puede cambiar a abandono una reserva cancelada.',
      );
    }

    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const fechaActual = `${año}-${mes}-${dia}`;
    const horaActual = ahora.toTimeString().split(' ')[0];

    // Validate fechaActual matches reserva fechaCita
    const citaStr =
      reserva.fechaCita instanceof Date
        ? reserva.fechaCita.toISOString().split('T')[0]
        : String(reserva.fechaCita).split('T')[0];

    if (fechaActual !== citaStr) {
      throw new BadRequestException(
        `La fecha actual del servidor (${fechaActual}) no coincide con la fecha de la cita (${citaStr}).`,
      );
    }

    if (reserva.estado === 'A-SIN-RESERVA') {
      throw new BadRequestException(
        'No se puede marcar como abandono una consulta sin reserva.',
      );
    }

    const actualMin = this.toMinutes(horaActual);
    const finMin = this.toMinutes(reserva.horaFinCita || '');

    if (actualMin <= finMin) {
      throw new BadRequestException(
        `No se puede marcar como abandono. La hora actual (${horaActual}) aún no supera la hora fin de la cita (${reserva.horaFinCita}).`,
      );
    }

    reserva.estado = 'ABANDONO';
    return await this.reservaPacienteRepository.save(reserva);
  }

  async markAsAttended(id: number, data: AtenderReservaDto) {
    const reserva = await this.findOne(id);
    if (reserva.estado === 'CANCELADA') {
      throw new BadRequestException(
        'No se puede marcar como atendida una reserva cancelada.',
      );
    }

    // Normalizar horas (algunas bases de datos devuelven HH:mm:ss, otras solo la cadena)
    if (reserva.estado !== 'A-SIN-RESERVA' && reserva.horaInicioCita && reserva.horaFinCita) {
      const atendidoMin = this.toMinutes(data.horaAtendido);
      const inicioMin = this.toMinutes(reserva.horaInicioCita);
      const finMin = this.toMinutes(reserva.horaFinCita);

      if (atendidoMin < inicioMin || atendidoMin > finMin) {
        reserva.estado = 'A-FUERA-HORARIO';
      } else {
        reserva.estado = 'ATENDIDO';
      }
    } else {
      // Para walk-ins o reservas sin horario, siempre es ATENDIDO
      reserva.estado = 'ATENDIDO';
    }

    reserva.fechaAtendido = new Date(data.fechaAtendido);
    reserva.horaAtendido = data.horaAtendido;

    return await this.reservaPacienteRepository.save(reserva);
  }

  private toMinutes(timeStr: string | null): number {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    return parts[0] * 60 + (parts[1] || 0);
  }

  private slotsOverlap(
    inicioA: string,
    finA: string,
    inicioB: string,
    finB: string,
  ): boolean {
    const startA = this.toMinutes(inicioA);
    const endA = this.toMinutes(finA);
    const startB = this.toMinutes(inicioB);
    const endB = this.toMinutes(finB);
    if (endA <= startA || endB <= startB) return false;
    return startA < endB && endA > startB;
  }

  private reservasSeSolapan(
    reserva: ReservaPaciente,
    horaInicio: string,
    horaFin: string,
  ): boolean {
    if (!reserva.horaInicioCita || !reserva.horaFinCita) return false;
    return this.slotsOverlap(
      horaInicio,
      horaFin,
      this.normalizeHora(reserva.horaInicioCita),
      this.normalizeHora(reserva.horaFinCita),
    );
  }

  private async assertSinSolapamientoReserva(
    params: {
      idUsuario: number;
      idDoctor: number;
      fechaCita: string;
      horaInicio: string;
      horaFin: string;
      excludeReservaId?: number;
    },
    manager?: EntityManager,
  ): Promise<void> {
    const {
      idUsuario,
      idDoctor,
      fechaCita,
      horaInicio,
      horaFin,
      excludeReservaId,
    } = params;
    const repo = manager
      ? manager.getRepository(ReservaPaciente)
      : this.reservaPacienteRepository;
    const excludeIdFilter = excludeReservaId
      ? { idReservaPaciente: Not(excludeReservaId) }
      : {};

    const reservasPaciente = await repo.find({
      where: {
        usuario: { idUsuario },
        fechaCita: fechaCita as any,
        estado: In([...ESTADOS_OCUPAN_AGENDA]),
        ...excludeIdFilter,
      },
      relations: ['doctor', 'doctor.persona', 'especialidad'],
    });

    const conflictoPaciente = reservasPaciente.find((r) =>
      this.reservasSeSolapan(r, horaInicio, horaFin),
    );

    if (conflictoPaciente) {
      throw new ConflictException({
        message:
          'El paciente ya tiene una cita que se solapa con este horario.',
        existingReserva: conflictoPaciente,
      });
    }

    const reservasDoctor = await repo.find({
      where: {
        doctor: { idDoctor },
        fechaCita: fechaCita as any,
        estado: In([...ESTADOS_OCUPAN_AGENDA]),
        ...excludeIdFilter,
      },
    });

    const conflictoDoctor = reservasDoctor.find((r) =>
      this.reservasSeSolapan(r, horaInicio, horaFin),
    );

    if (conflictoDoctor) {
      throw new ConflictException(
        'El horario seleccionado para este doctor se solapa con otra cita existente.',
      );
    }
  }

  async remove(id: number) {
    const reserva = await this.findOne(id);

    const reservaCancelada = this.reservaPacienteCanceladaRepository.create({
      usuario: reserva.usuario,
      especialidad: reserva.especialidad,
      posta: reserva.posta,
      doctor: reserva.doctor,
      fechaCita: reserva.fechaCita,
      horaInicioCita: reserva.horaInicioCita,
      horaFinCita: reserva.horaFinCita,
      fechaSolicitud: reserva.fechaSolicitud,
      fechaCancelacionCita: new Date(),
      motivoCancelacion: 'Cancelado por Paciente',
      observaciones: reserva.observaciones,
      estado: 'CANCELADA',
    });

    await this.detachNotificationsAndDeleteReserva(id);
    const savedCancelada =
      await this.reservaPacienteCanceladaRepository.save(reservaCancelada);

    this.enqueueNotification(() =>
      this.notificationsService.notifyReservationCancelled(reserva, 'paciente'),
    );

    return savedCancelada;
  }

  /**
   * Pasa a ATRASO las reservas PENDIENTE cuya fecha+horaFin ya pasó (America/La_Paz).
   * Pensado para ejecutarse desde un cron; no requiere acción del doctor.
   */
  async markOverduePendientesAsAtraso(): Promise<number> {
    const pendientes = await this.reservaPacienteRepository.find({
      where: { estado: 'PENDIENTE' },
      select: [
        'idReservaPaciente',
        'fechaCita',
        'horaFinCita',
        'estado',
      ],
    });

    const nowMs = Date.now();
    const ids: number[] = [];

    for (const reserva of pendientes) {
      if (!reserva.horaFinCita) continue;
      const finMs = this.parseCitaDateTimeMs(
        reserva.fechaCita,
        reserva.horaFinCita,
      );
      if (finMs != null && nowMs > finMs) {
        ids.push(reserva.idReservaPaciente);
      }
    }

    if (ids.length === 0) return 0;

    await this.reservaPacienteRepository.update(
      { idReservaPaciente: In(ids) },
      { estado: 'ATRASO' },
    );

    return ids.length;
  }

  /** Interpreta fecha+hora de cita en America/La_Paz (UTC-4, sin DST). */
  private parseCitaDateTimeMs(
    fechaCita: Date | string | null,
    hora: string | null,
  ): number | null {
    if (!fechaCita || !hora) return null;
    const dateStr =
      typeof fechaCita === 'string'
        ? fechaCita.slice(0, 10)
        : fechaCita.toISOString().slice(0, 10);
    const timePart = hora.length >= 8 ? hora.slice(0, 8) : `${hora.slice(0, 5)}:00`;
    const ms = new Date(`${dateStr}T${timePart}-04:00`).getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  private async detachNotificationsAndDeleteReserva(id: number): Promise<void> {
    await this.notificationsService.detachReservaReferences(id);
    await this.reservaPacienteRepository.delete(id);
  }

  /**
   * Notificaciones/correo en background: no deben bloquear ni correr dentro
   * de una TX abierta (provoca deadlock con FK a reservas_paciente).
   */
  private enqueueNotification(task: () => Promise<void>): void {
    void task().catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Notificación de reserva omitida/fallida: ${message}`);
    });
  }
}
