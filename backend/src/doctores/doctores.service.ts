import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Doctor } from '../modules/medical/entities/doctor.entity';
import { EspecialidadMedica } from '../modules/medical/entities/especialidad-medica.entity';
import { AsignacionDoctorConsultorio } from '../modules/medical/entities/asignacion-doctor-consultorio.entity';
import { ConsultaMedica } from '../modules/appointments/entities/consulta-medica.entity';
import { ReservaPaciente } from '../modules/appointments/entities/reserva-paciente.entity';
import { Persona } from '../modules/users/entities/persona.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { UpdateDoctorContactoDto } from './dto/update-doctor-contacto.dto';
import {
  sanitizeAsignacionDoctorPublico,
  sanitizeDoctorTelefonoPublico,
} from './doctor-public.util';

@Injectable()
export class DoctoresService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(EspecialidadMedica)
    private readonly especialidadRepository: Repository<EspecialidadMedica>,
    @InjectRepository(AsignacionDoctorConsultorio)
    private readonly asignacionRepository: Repository<AsignacionDoctorConsultorio>,
    @InjectRepository(ConsultaMedica)
    private readonly consultaRepository: Repository<ConsultaMedica>,
    @InjectRepository(ReservaPaciente)
    private readonly reservaPacienteRepository: Repository<ReservaPaciente>,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
  ) { }

  async create(createDoctorDto: CreateDoctorDto) {
    const {
      idPersona,
      idEspecialidadMedica,
      nombres,
      primerApellido,
      segundoApellido,
      ci,
      celular,
      email,
      genero,
      direccion,
      ...doctorData
    } = createDoctorDto;

    const persona = await this.personaRepository.findOne({
      where: { idPersona },
    });
    if (!persona) {
      throw new NotFoundException(`Persona con ID ${idPersona} no encontrada.`);
    }

    // Actualizar datos de persona si se proporcionan
    let personaUpdated = false;
    if (nombres) { persona.nombres = nombres; personaUpdated = true; }
    if (primerApellido) { persona.primerApellido = primerApellido; personaUpdated = true; }
    if (segundoApellido) { persona.segundoApellido = segundoApellido; personaUpdated = true; }
    if (ci) { persona.ci = ci; personaUpdated = true; }
    if (celular) { persona.celular = celular; personaUpdated = true; }
    if (email) { persona.email = email; personaUpdated = true; }
    if (genero) { persona.genero = genero; personaUpdated = true; }
    if (direccion) { persona.direccion = direccion; personaUpdated = true; }

    if (personaUpdated) {
      await this.personaRepository.save(persona);
    }

    const especialidad = await this.especialidadRepository.findOne({
      where: { idEspecialidadMedica },
    });
    if (!especialidad) {
      throw new NotFoundException(
        `Especialidad médica con ID ${idEspecialidadMedica} no encontrada.`,
      );
    }

    const existingDoctor = await this.doctorRepository.findOne({
      where: { persona: { idPersona } },
      withDeleted: true,
    });

    if (existingDoctor) {
      if (existingDoctor.deletedAt === null) {
        throw new BadRequestException(
          `La persona con ID ${idPersona} ya está registrada como doctor activo.`,
        );
      }

      // Restaurar doctor eliminado
      existingDoctor.deletedAt = null as any;
      this.doctorRepository.merge(existingDoctor, {
        ...doctorData,
        especialidad,
      });
      return await this.doctorRepository.save(existingDoctor);
    }

    const newDoctor = this.doctorRepository.create({
      ...doctorData,
      persona,
      especialidad,
    });

    return await this.doctorRepository.save(newDoctor);
  }

  async findAll() {
    return await this.doctorRepository.find({
      relations: ['persona', 'especialidad'],
    });
  }

  async findOne(id: number) {
    const doctor = await this.doctorRepository.findOne({
      where: { idDoctor: id },
      relations: ['persona', 'especialidad'],
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor con ID ${id} no encontrado.`);
    }
    return doctor;
  }

  async findOneByPersona(idPersona: number) {
    const doctor = await this.doctorRepository.findOne({
      where: { persona: { idPersona } },
      relations: ['persona', 'especialidad'],
    });
    if (!doctor) {
      throw new NotFoundException(
        `Doctor con ID de persona ${idPersona} no encontrado.`,
      );
    }
    return doctor;
  }

  async update(id: number, updateDoctorDto: UpdateDoctorDto) {
    const doctor = await this.findOne(id);
    const {
      idPersona,
      idEspecialidadMedica,
      nombres,
      primerApellido,
      segundoApellido,
      ci,
      celular,
      email,
      genero,
      direccion,
      ...doctorData
    } = updateDoctorDto;

    if (idPersona) {
      const persona = await this.personaRepository.findOne({
        where: { idPersona },
      });
      if (!persona)
        throw new NotFoundException(
          `Persona con ID ${idPersona} no encontrada.`,
        );

      if (doctor.persona.idPersona !== idPersona) {
        const existingDoctor = await this.doctorRepository.findOne({
          where: { persona: { idPersona } },
        });
        if (existingDoctor) {
          throw new BadRequestException(
            `La persona con ID ${idPersona} ya está registrada como doctor.`,
          );
        }
      }
      doctor.persona = persona;
    }

    // Actualizar datos de la persona vinculada si se proporcionan
    if (nombres) doctor.persona.nombres = nombres;
    if (primerApellido) doctor.persona.primerApellido = primerApellido;
    if (segundoApellido) doctor.persona.segundoApellido = segundoApellido;
    if (ci) doctor.persona.ci = ci;
    if (celular) doctor.persona.celular = celular;
    if (email) doctor.persona.email = email;
    if (genero) doctor.persona.genero = genero;
    if (direccion) doctor.persona.direccion = direccion;

    if (idEspecialidadMedica) {
      const especialidad = await this.especialidadRepository.findOne({
        where: { idEspecialidadMedica },
      });
      if (!especialidad)
        throw new NotFoundException(
          `Especialidad médica con ID ${idEspecialidadMedica} no encontrada.`,
        );
      doctor.especialidad = especialidad;
    }

    this.doctorRepository.merge(doctor, doctorData);

    const telefono = (doctor.telefonoEmergencia || '').trim();
    if (doctor.compartirTelefonoEmergencia && !telefono) {
      throw new BadRequestException(
        'Debes registrar un teléfono de emergencia antes de compartirlo con los pacientes.',
      );
    }

    return await this.doctorRepository.save(doctor);
  }

  async remove(id: number) {
    const doctor = await this.findOne(id);

    const asignaciones = await this.asignacionRepository.find({
      where: { doctor: { idDoctor: id } },
    });

    if (asignaciones.length > 0) {
      for (const asignacion of asignaciones) {
        asignacion.activo = false;
      }
      await this.asignacionRepository.save(asignaciones);
      await this.asignacionRepository.softRemove(asignaciones);
    }

    return await this.doctorRepository.softRemove(doctor);
  }

  async findByEspecialidad(idEspecialidad: number) {
    const especialidad = await this.especialidadRepository.findOne({
      where: { idEspecialidadMedica: idEspecialidad },
    });

    if (!especialidad) {
      throw new NotFoundException(
        `La especialidad con ID ${idEspecialidad} no existe.`,
      );
    }

    const asignaciones = await this.asignacionRepository.find({
      where: {
        especialidad: { idEspecialidadMedica: idEspecialidad },
        activo: true,
      },
      relations: [
        'doctor',
        'doctor.persona',
        'consultorio',
        'consultorio.posta',
      ],
    });

    if (asignaciones.length === 0) {
      return {
        message: `No se encontraron doctores asignados para la especialidad ${especialidad.nombre}`,
        data: [],
      };
    }

    return {
      message: 'Operación exitosa',
      data: asignaciones.map((a) => sanitizeAsignacionDoctorPublico(a)),
    };
  }

  async findLastDoctorForUserBySpecialty(
    idUsuario: number,
    idEspecialidad: number,
  ) {
    const reserva = await this.reservaPacienteRepository.findOne({
      where: {
        usuario: { idUsuario },
        especialidad: { idEspecialidadMedica: idEspecialidad },
        estado: In(['ATENDIDO', 'A-FUERA-HORARIO', 'A-SIN-RESERVA']),
      },
      relations: ['doctor', 'doctor.persona', 'doctor.especialidad'],
      order: {
        fechaAtendido: 'DESC',
        horaAtendido: 'DESC',
        fechaCita: 'DESC',
        horaInicioCita: 'DESC',
      },
    });

    if (!reserva) {
      return {
        message:
          'No se encontró atención previa para el usuario en esta especialidad.',
        data: null,
      };
    }

    return {
      message: 'Último doctor encontrado',
      data: sanitizeDoctorTelefonoPublico(reserva.doctor),
    };
  }

  async updateContactoMios(idPersona: number, dto: UpdateDoctorContactoDto) {
    const doctor = await this.findOneByPersona(idPersona);

    if (dto.telefonoEmergencia !== undefined) {
      const cleaned = (dto.telefonoEmergencia || '').trim();
      doctor.telefonoEmergencia = cleaned || (null as any);
    }

    if (dto.compartirTelefonoEmergencia !== undefined) {
      doctor.compartirTelefonoEmergencia = Boolean(
        dto.compartirTelefonoEmergencia,
      );
    }

    const telefono = (doctor.telefonoEmergencia || '').trim();
    if (doctor.compartirTelefonoEmergencia && !telefono) {
      throw new BadRequestException(
        'Debes registrar un teléfono de emergencia antes de compartirlo con los pacientes.',
      );
    }

    return await this.doctorRepository.save(doctor);
  }
}
