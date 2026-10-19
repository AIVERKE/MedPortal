import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EspecialidadMedica } from '../modules/medical/entities/especialidad-medica.entity';
import { CreateEspecialidadMedica } from './dto/create-especialidad-medica/create-especialidad-medica';

@Injectable()
export class EspecialidadMedicaService {
  constructor(
    @InjectRepository(EspecialidadMedica)
    private readonly especialidadMedicaRepository: Repository<EspecialidadMedica>,
  ) {}

  // Method to save a new medical specialty
  async create(data: CreateEspecialidadMedica) {
    // 1. Create an instance of the entity with the DTO data
    const newEspecialidadMedica =
      this.especialidadMedicaRepository.create(data);
    // 2. Save the new medical specialty in the Postgres database
    return await this.especialidadMedicaRepository.save(newEspecialidadMedica);
  }

  // Method to find a medical specialty by its ID
  async findOne(id: number) {
    const especialidadMedica =
      await this.especialidadMedicaRepository.findOneBy({
        idEspecialidadMedica: id,
      });
    if (!especialidadMedica) {
      throw new NotFoundException(
        'Especialidad médica con ID ' + id + ' no encontrada.',
      );
    }
    return especialidadMedica;
  }

  // Method to retrieve all medical specialties
  async findAll() {
    // 1. Search all medical specialties in the repository
    return await this.especialidadMedicaRepository.find();
  }

  // Method to update an existing medical specialty
  async update(id: number, data: Partial<CreateEspecialidadMedica>) {
    const especialidadMedica = await this.findOne(id);
    await this.especialidadMedicaRepository.update(id, data);
    return { ...especialidadMedica, ...data };
  }

  // Method to delete a medical specialty by its ID
  async remove(id: number) {
    // 1. Buscamos la especialidad antes de eliminarla.
    const especialidad = await this.findOne(id);

    // 2. Utilizamos softRemove para eliminar una especialidad médica.
    return await this.especialidadMedicaRepository.softRemove(especialidad);
  }
}
