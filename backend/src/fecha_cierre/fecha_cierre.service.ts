import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FechaCierre } from '../modules/medical/entities/fecha-cierre.entity';
import { CreateFechaCierre } from './dto/create_fecha_cierre/create_fecha_cierre';
import { NotFoundError } from 'rxjs';

@Injectable()
export class FechaCierreService {
  constructor(
    @InjectRepository(FechaCierre)
    private readonly fechaCierreRepository: Repository<FechaCierre>,
  ) {}

  // Method to save a new closing date
  async create(data: CreateFechaCierre) {
    // 1. Create an instance of the entity with the DTO data
    const newFechaCierre = this.fechaCierreRepository.create(data);

    // 2. Save the new closing date in the Postgres database
    return await this.fechaCierreRepository.save(newFechaCierre);
  }

  // Method to find a closing date by its ID
  async findOne(id: number) {
    // 1. Search in the repository
    const fecha = await this.fechaCierreRepository.findOneBy({
      idFechaCierre: id,
    });
    if (!fecha) {
      throw new NotFoundException(
        'Fecha de cierre con ID ' + id + ' no encontrada.',
      );
    }
    return fecha;
  }

  // Method to retrieve all closing dates
  async findAll() {
    // 1. Search all closing dates in the repository
    return await this.fechaCierreRepository.find();
  }

  // Method to update an existing closing date
  async update(id: number, data: Partial<CreateFechaCierre>) {
    const fecha = await this.findOne(id);
    await this.fechaCierreRepository.update(fecha.idFechaCierre, data);
    return { ...fecha, ...data };
  }

  // Method to delete a closing date by its ID
  async remove(id: number) {
    // 1. Buscamos la fecha de cierre antes de eliminarla.
    const fecha = await this.findOne(id);

    // 2. Utilizamos softRemove para eliminar una fecha cierre.
    return await this.fechaCierreRepository.softRemove(fecha);
  }
}
