import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { Notificacion } from './entities/notificacion.entity';
import { NotificationType } from './enums/notification-type.enum';
import { ReservaPaciente } from '../appointments/entities/reserva-paciente.entity';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { MailService } from '../mail/mail.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: jest.Mocked<Repository<Notificacion>>;
  let usuariosService: jest.Mocked<Pick<UsuariosService, 'findOneByPersona'>>;
  let mailService: {
    sendAppointmentCreatedToDoctor: jest.Mock;
    sendAppointmentConfirmedToPatient: jest.Mock;
    sendReminder24h: jest.Mock;
    sendAppointmentCancelled: jest.Mock;
    sendAppointmentRescheduled: jest.Mock;
  };

  const mockReserva = {
    idReservaPaciente: 1,
    fechaCita: '2026-06-25',
    horaInicioCita: '10:00:00',
    doctor: {
      persona: { idPersona: 3, nombres: 'Carlos', primerApellido: 'García' },
    },
    usuario: {
      idUsuario: 5,
      persona: {
        nombres: 'Juan',
        primerApellido: 'Pérez',
        ci: '1234567',
        celular: '70000000',
        email: 'juan@test.com',
      },
    },
    especialidad: { nombre: 'Medicina General' },
    posta: { nombre: 'Posta Central', direccion: 'Av. Villazón' },
  } as ReservaPaciente;

  beforeEach(async () => {
    usuariosService = {
      findOneByPersona: jest.fn(),
    };

    mailService = {
      sendAppointmentCreatedToDoctor: jest.fn(),
      sendAppointmentConfirmedToPatient: jest.fn(),
      sendReminder24h: jest.fn(),
      sendAppointmentCancelled: jest.fn(),
      sendAppointmentRescheduled: jest.fn(),
    };

    repository = {
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn(async (dto) => ({ idNotificacion: 1, ...dto })),
      count: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<Notificacion>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notificacion), useValue: repository },
        { provide: UsuariosService, useValue: usuariosService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  it('no duplica notificaciones con la misma clave', async () => {
    repository.findOne.mockResolvedValue({ idNotificacion: 99 } as Notificacion);

    const result = await service.createIfNotExists({
      idUsuario: 5,
      tipo: NotificationType.CITA_RECORDATORIO_24H,
      titulo: 'Test',
      mensaje: 'Mensaje',
      claveDedup: 'CITA_RECORDATORIO_24H:1:5',
    });

    expect(result).toBeNull();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('genera mensaje de recordatorio 24h para paciente', () => {
    const msg = service.buildMessage(
      mockReserva,
      NotificationType.CITA_RECORDATORIO_24H,
      'paciente',
    );

    expect(msg.titulo).toBe('Recordatorio de cita');
    expect(msg.mensaje).toContain('Dr. Carlos García');
    expect(msg.mensaje).toContain('Posta Central');
  });

  it('genera mensaje de recordatorio 1h para doctor', () => {
    const msg = service.buildMessage(
      mockReserva,
      NotificationType.CITA_RECORDATORIO_1H,
      'doctor',
    );

    expect(msg.mensaje).toContain('Juan Pérez');
    expect(msg.mensaje).toContain('1 hora');
  });

  it('genera resumen diario para doctor', () => {
    const summary = service.buildDoctorDailySummary([mockReserva], '2026-06-25');

    expect(summary.titulo).toBe('Resumen de consultas del día');
    expect(summary.mensaje).toContain('1 consulta');
    expect(summary.mensaje).toContain('Juan Pérez');
  });

  it('genera notificación de nueva reserva para doctor con datos del paciente', () => {
    const msg = service.buildNewReservationDoctorMessage(mockReserva);

    expect(msg.titulo).toBe('Nueva reserva de cita');
    expect(msg.mensaje).toContain('Juan Pérez');
    expect(msg.mensaje).toContain('Posta Central');
    expect(msg.metadata.pacienteCi).toBe('1234567');
    expect(msg.metadata.pacienteCelular).toBe('70000000');
    expect(msg.metadata.postaDireccion).toBe('Av. Villazón');
  });

  it('notifica al doctor cuando se crea una reserva', async () => {
    usuariosService.findOneByPersona.mockResolvedValue({
      idUsuario: 10,
      deletedAt: null,
    } as any);
    repository.findOne.mockResolvedValue(null);

    await service.notifyDoctorNewReservation(mockReserva);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: NotificationType.CITA_NUEVA_RESERVA,
        usuario: { idUsuario: 10 },
      }),
    );
  });
});
