import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostaMedica } from '../modules/medical/entities/posta-medica.entity';
import { CreatePostaMedica } from './dto/create-posta-medica/create-posta-medica';

@Injectable()
export class PostasMedicasService {
  constructor(
    @InjectRepository(PostaMedica)
    private readonly postaMedicaRepository: Repository<PostaMedica>,
  ) {}

  // Method to save a new medical posta
  async create(data: CreatePostaMedica) {
    // 1. Create an instance of the entity with the DTO data
    const newPostaMedica = this.postaMedicaRepository.create(data);
    // 2. Save the new medical posta in the Postgres database
    return await this.postaMedicaRepository.save(newPostaMedica);
  }

  // Method to find a medical posta by its ID
  async findOne(id: number) {
    // 1. Search in the repository
    return await this.postaMedicaRepository.findOneBy({
      idPosta: id,
    });
  }

  // Method to retrieve all medical postas
  async findAll() {
    // 1. Search all medical postas in the repository
    return await this.postaMedicaRepository.find();
  }

  // Method to update an existing medical posta
  async update(id: number, data: Partial<CreatePostaMedica>) {
    // 1. Update the medical posta in the database
    await this.postaMedicaRepository.update(id, data);
    // 2. Search the updated medical posta and return it
    return this.findOne(id);
  }

  // Method to delete a medical posta by its ID
  async remove(id: number) {
    // 1. Buscamos la posta antes de eliminarla.
    const posta = await this.findOne(id);
    if (!posta)
      throw new NotFoundException(`Posta médica con ID ${id} no encontrada`);

    // 2. Utilizamos softRemove para eliminar una posta médica.
    return await this.postaMedicaRepository.softRemove(posta);
  }

  async findByEspecialidad(id_especialidad: number) {
    // Buscamos todas las postas que coincidan con la especialidad
    const postas = await this.postaMedicaRepository.find({
      where: {
        consultorios: {
          especialidad: {
            idEspecialidadMedica: id_especialidad,
          },
        },
      },
      relations: ['consultorios', 'consultorios.especialidad'],
    });

    if (postas.length === 0) {
      throw new NotFoundException(
        `No se encontraron postas médicas para la especialidad con ID ${id_especialidad}`,
      );
    }
    return postas;
  }

  async findConsultorios(id: number) {
    const posta = await this.postaMedicaRepository.findOne({
      where: { idPosta: id },
      relations: ['consultorios', 'consultorios.especialidad'],
    });

    if (!posta) {
      throw new NotFoundException(`Posta médica con ID ${id} no encontrada`);
    }

    return posta.consultorios;
  }
}
