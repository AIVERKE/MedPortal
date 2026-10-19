import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facultad } from '../modules/users/entities/facultad.entity';
import { CreateFacultadDto } from './dto/create-facultad.dto';
import { UpdateFacultadDto } from './dto/update-facultad.dto';

@Injectable()
export class FacultadesService {
  constructor(
    @InjectRepository(Facultad)
    private readonly facultadRepository: Repository<Facultad>,
  ) {}

  async create(createFacultadDto: CreateFacultadDto) {
    const nombre = createFacultadDto.nombre.trim();
    const existing = await this.facultadRepository.findOne({
      where: { nombre },
      withDeleted: true,
    });

    if (existing && !existing.deletedAt) {
      throw new BadRequestException(`La facultad "${nombre}" ya existe.`);
    }

    if (existing && existing.deletedAt) {
      existing.deletedAt = null as any;
      existing.activo = createFacultadDto.activo ?? true;
      existing.nombre = nombre;
      return this.facultadRepository.save(existing);
    }

    const facultad = this.facultadRepository.create({
      nombre,
      activo: createFacultadDto.activo ?? true,
    });
    return this.facultadRepository.save(facultad);
  }

  async findAll(includeInactive = false) {
    return this.facultadRepository.find({
      where: includeInactive ? {} : { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(idFacultad: number) {
    const facultad = await this.facultadRepository.findOne({ where: { idFacultad } });
    if (!facultad) {
      throw new NotFoundException(`Facultad con ID ${idFacultad} no encontrada.`);
    }
    return facultad;
  }

  async update(idFacultad: number, updateFacultadDto: UpdateFacultadDto) {
    const facultad = await this.findOne(idFacultad);
    if (updateFacultadDto.nombre) {
      facultad.nombre = updateFacultadDto.nombre.trim();
    }
    if (typeof updateFacultadDto.activo === 'boolean') {
      facultad.activo = updateFacultadDto.activo;
    }
    return this.facultadRepository.save(facultad);
  }

  async remove(idFacultad: number) {
    const facultad = await this.findOne(idFacultad);
    return this.facultadRepository.softRemove(facultad);
  }
}
