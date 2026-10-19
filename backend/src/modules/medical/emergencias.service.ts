import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Emergencia } from './entities/emergencia.entity';
import { Doctor } from './entities/doctor.entity';
import { CreateEmergenciaDto } from './dto/create-emergencia.dto';
import { UpdateEmergenciaDto } from './dto/update-emergencia.dto';

@Injectable()
export class EmergenciasService {
  constructor(
    @InjectRepository(Emergencia)
    private readonly emergenciaRepository: Repository<Emergencia>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) { }

  async create(createEmergenciaDto: CreateEmergenciaDto): Promise<Emergencia> {
    const { idPersona, ...rest } = createEmergenciaDto;

    const doctor = await this.doctorRepository.findOne({
      where: { persona: { idPersona } },
      relations: ['persona'],
    });

    if (!doctor) {
      throw new NotFoundException(
        `Doctor con ID de persona ${idPersona} no encontrado`,
      );
    }

    const emergencia = this.emergenciaRepository.create({
      ...rest,
      doctor,
    });

    return await this.emergenciaRepository.save(emergencia);
  }

  async findAll(): Promise<Emergencia[]> {
    return await this.emergenciaRepository.find({
      relations: ['doctor', 'doctor.persona'],
    });
  }

  async findOne(id: number): Promise<Emergencia> {
    const emergencia = await this.emergenciaRepository.findOne({
      where: { idEmergencia: id },
      relations: ['doctor', 'doctor.persona'],
    });

    if (!emergencia) {
      throw new NotFoundException(`Emergencia con ID ${id} no encontrada`);
    }

    return emergencia;
  }

  async findByPersona(idPersona: number): Promise<Emergencia[]> {
    return await this.emergenciaRepository.find({
      where: { doctor: { persona: { idPersona } } },
      relations: ['doctor', 'doctor.persona'],
    });
  }

  async update(
    id: number,
    updateEmergenciaDto: UpdateEmergenciaDto,
  ): Promise<Emergencia> {
    const emergencia = await this.findOne(id);

    if (updateEmergenciaDto.idPersona) {
      const doctor = await this.doctorRepository.findOne({
        where: { persona: { idPersona: updateEmergenciaDto.idPersona } },
        relations: ['persona'],
      });
      if (!doctor) {
        throw new NotFoundException(
          `Doctor con ID de persona ${updateEmergenciaDto.idPersona} no encontrado`,
        );
      }
      emergencia.doctor = doctor;
    }

    const { idPersona, ...rest } = updateEmergenciaDto;
    this.emergenciaRepository.merge(emergencia, rest);

    return await this.emergenciaRepository.save(emergencia);
  }

  async remove(id: number): Promise<void> {
    const emergencia = await this.findOne(id);
    await this.emergenciaRepository.softDelete(id);
  }
}
