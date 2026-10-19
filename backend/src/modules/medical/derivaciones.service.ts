import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Derivacion } from './entities/derivacion.entity';
import { EspecialidadMedica } from './entities/especialidad-medica.entity';
import { Doctor } from './entities/doctor.entity';
import { CreateDerivacionDto } from './dto/create-derivacion.dto';
import { UpdateDerivacionDto } from './dto/update-derivacion.dto';

@Injectable()
export class DerivacionesService {
  constructor(
    @InjectRepository(Derivacion)
    private readonly derivacionRepository: Repository<Derivacion>,
    @InjectRepository(EspecialidadMedica)
    private readonly especialidadRepository: Repository<EspecialidadMedica>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) { }

  async create(createDerivacionDto: CreateDerivacionDto): Promise<Derivacion> {
    const { idHcl, idEspecialidad, idPersonaEmisor, fechaEmision, ...rest } = createDerivacionDto;

    const especialidad = await this.especialidadRepository.findOne({
      where: { idEspecialidadMedica: idEspecialidad },
    });
    if (!especialidad) {
      throw new NotFoundException(
        `Especialidad con ID ${idEspecialidad} no encontrada`,
      );
    }

    const doctor = await this.doctorRepository.findOne({
      where: { persona: { idPersona: idPersonaEmisor } },
      relations: ['persona'],
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor con ID de persona ${idPersonaEmisor} no encontrado`);
    }

    const derivacionData = {
      idHcl,
      idEspecialidad,
      idDoctorEmisor: doctor.idDoctor,
      ...rest,
      ...(fechaEmision ? { fechaEmision: new Date(fechaEmision) } : {}),
    };

    const derivacion = this.derivacionRepository.create(derivacionData);

    return await this.derivacionRepository.save(derivacion);
  }

  async findAll(): Promise<Derivacion[]> {
    return await this.derivacionRepository.find({
      relations: ['historiaClinica', 'especialidad', 'doctorEmisor', 'doctorEmisor.persona', 'consultaOrigen'],
    });
  }

  async findOne(idDerivacion: number): Promise<Derivacion> {
    const derivacion = await this.derivacionRepository.findOne({
      where: { idDerivacion },
      relations: ['historiaClinica', 'especialidad', 'doctorEmisor', 'doctorEmisor.persona', 'consultaOrigen'],
    });

    if (!derivacion) {
      throw new NotFoundException(
        `Derivación con ID ${idDerivacion} no encontrada`,
      );
    }

    return derivacion;
  }

  async update(
    idDerivacion: number,
    updateDerivacionDto: UpdateDerivacionDto,
  ): Promise<Derivacion> {
    const derivacion = await this.findOne(idDerivacion);

    if (updateDerivacionDto.idEspecialidad) {
      const especialidad = await this.especialidadRepository.findOne({
        where: { idEspecialidadMedica: updateDerivacionDto.idEspecialidad },
      });
      if (!especialidad)
        throw new NotFoundException(
          `Especialidad con ID ${updateDerivacionDto.idEspecialidad} no encontrada`,
        );
    }

    if (updateDerivacionDto.idPersonaEmisor) {
      const doctor = await this.doctorRepository.findOne({
        where: { persona: { idPersona: updateDerivacionDto.idPersonaEmisor } },
        relations: ['persona'],
      });
      if (!doctor)
        throw new NotFoundException(
          `Doctor con ID de persona ${updateDerivacionDto.idPersonaEmisor} no encontrado`,
        );
      derivacion.doctorEmisor = doctor;
    }

    const { idPersonaEmisor, ...updateDerivacionRest } = updateDerivacionDto;
    const updateData: any = { ...updateDerivacionRest };

    if (updateDerivacionDto.fechaEmision) {
      updateData.fechaEmision = new Date(updateDerivacionDto.fechaEmision);
    }

    this.derivacionRepository.merge(derivacion, updateData);
    return await this.derivacionRepository.save(derivacion);
  }

  async findByPersona(idPersona: number): Promise<Derivacion[]> {
    return await this.derivacionRepository.find({
      where: { doctorEmisor: { persona: { idPersona: idPersona } } },
      relations: ['historiaClinica', 'especialidad', 'consultaOrigen'],
    });
  }

  async remove(idDerivacion: number): Promise<void> {
    const derivacion = await this.findOne(idDerivacion);
    await this.derivacionRepository.softRemove(derivacion);
  }

  async hasDerivacion(
    idHcl: number,
    idEspecialidad: number,
  ): Promise<boolean> {

    const especialidad = await this.especialidadRepository.findOne({
      where: { idEspecialidadMedica: idEspecialidad },
    });
    if (!especialidad) {
      throw new NotFoundException(
        `Especialidad con ID ${idEspecialidad} no encontrada`,
      );
    }

    const derivacion = await this.derivacionRepository.findOne({
      where: {
        idHcl,
        idEspecialidad,
      },
    });
    return !!derivacion;
  }
}
