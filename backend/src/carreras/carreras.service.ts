import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrera } from '../modules/users/entities/carrera.entity';
import { Facultad } from '../modules/users/entities/facultad.entity';
import { CreateCarreraDto } from './dto/create-carrera.dto';
import { UpdateCarreraDto } from './dto/update-carrera.dto';

@Injectable()
export class CarrerasService {
  constructor(
    @InjectRepository(Carrera)
    private readonly carreraRepository: Repository<Carrera>,
    @InjectRepository(Facultad)
    private readonly facultadRepository: Repository<Facultad>,
  ) {}

  async create(createCarreraDto: CreateCarreraDto) {
    const facultad = await this.facultadRepository.findOne({
      where: { idFacultad: createCarreraDto.idFacultad, activo: true },
    });
    if (!facultad) {
      throw new NotFoundException('Facultad no encontrada o inactiva.');
    }

    const nombre = createCarreraDto.nombre.trim();
    const exists = await this.carreraRepository.findOne({
      where: { nombre, facultad: { idFacultad: facultad.idFacultad } },
      relations: ['facultad'],
      withDeleted: true,
    });

    if (exists && !exists.deletedAt) {
      throw new BadRequestException('La carrera ya existe para esa facultad.');
    }

    if (exists && exists.deletedAt) {
      exists.deletedAt = null as any;
      exists.nombre = nombre;
      exists.facultad = facultad;
      exists.activo = createCarreraDto.activo ?? true;
      return this.carreraRepository.save(exists);
    }

    const carrera = this.carreraRepository.create({
      nombre,
      facultad,
      activo: createCarreraDto.activo ?? true,
    });
    return this.carreraRepository.save(carrera);
  }

  async findAll(facultadId?: number, includeInactive = false) {
    return this.carreraRepository.find({
      where: {
        ...(facultadId ? { facultad: { idFacultad: facultadId } } : {}),
        ...(includeInactive ? {} : { activo: true }),
      },
      relations: ['facultad'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(idCarrera: number) {
    const carrera = await this.carreraRepository.findOne({
      where: { idCarrera },
      relations: ['facultad'],
    });
    if (!carrera) {
      throw new NotFoundException(`Carrera con ID ${idCarrera} no encontrada.`);
    }
    return carrera;
  }

  async update(idCarrera: number, updateCarreraDto: UpdateCarreraDto) {
    const carrera = await this.findOne(idCarrera);

    if (updateCarreraDto.idFacultad) {
      const facultad = await this.facultadRepository.findOne({
        where: { idFacultad: updateCarreraDto.idFacultad, activo: true },
      });
      if (!facultad) {
        throw new NotFoundException('Facultad no encontrada o inactiva.');
      }
      carrera.facultad = facultad;
    }

    if (updateCarreraDto.nombre) {
      carrera.nombre = updateCarreraDto.nombre.trim();
    }
    if (typeof updateCarreraDto.activo === 'boolean') {
      carrera.activo = updateCarreraDto.activo;
    }

    return this.carreraRepository.save(carrera);
  }

  async remove(idCarrera: number) {
    const carrera = await this.findOne(idCarrera);
    return this.carreraRepository.softRemove(carrera);
  }
}
