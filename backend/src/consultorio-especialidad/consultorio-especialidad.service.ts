import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ConsultorioEspecialidad } from '../modules/medical/entities/consultorio-especialidad.entity';
import { CreateConsultorioEspecialidad } from './dto/create-consultorio-especialidad/create-consultorio-especialidad';
import { PostasMedicasService } from '../postas-medicas/postas-medicas.service';
import { EspecialidadMedicaService } from '../especialidad-medica/especialidad-medica.service';

@Injectable()
export class ConsultorioEspecialidadService {
  constructor(
    @InjectRepository(ConsultorioEspecialidad)
    private consultorioEspecialidadRepository: Repository<ConsultorioEspecialidad>,
    private postasMedicasService: PostasMedicasService,
    private especialidadMedicaService: EspecialidadMedicaService,
  ) {}

  // Method to save a new medical specialty office
  async create(data: CreateConsultorioEspecialidad) {
    // 1. Validamos si existe la posta médica asociada
    const posta = await this.postasMedicasService.findOne(data.idPosta);
    if (!posta) {
      throw new NotFoundException(
        'La posta médica con ID ' + data.idPosta + ' no existe.',
      );
    }

    // 2. Validamos si existe la especialidad médica asociada
    const especialidad = await this.especialidadMedicaService.findOne(
      data.idEspecialidad,
    );
    if (!especialidad) {
      throw new NotFoundException(
        'La especialidad médica con ID ' + data.idEspecialidad + ' no existe.',
      );
    }

    // 3. Creamos una instancia con los datos del DTO
    const newConsultorioEspecialidad =
      this.consultorioEspecialidadRepository.create({
        ...data,
        posta,
        especialidad,
      });

    // 4. Guardamos el nuevo consultorio especialidad en la base de datos Postgres
    return await this.consultorioEspecialidadRepository.save(
      newConsultorioEspecialidad,
    );
  }

  // Method to find a medical specialty office by its ID
  async findOne(id: number) {
    // 1. Buscamos el consultorio por su ID y traemos los datos relacionados
    const consultorio = await this.consultorioEspecialidadRepository.findOne({
      where: { idConsultorio: id },
      relations: ['posta', 'especialidad'],
    });

    //2. Validamos si se encontró el consultorio
    if (!consultorio) {
      throw new NotFoundException(
        'El consultorio con ID ' + id + ' no existe.',
      );
    }
    return consultorio;
  }

  // Method to retrieve all medical specialty offices
  async findAll() {
    // 1. Buscamos todos los consultorios en el repositorio y traemos los datos relacionados
    const consultorios = await this.consultorioEspecialidadRepository.find({
      relations: ['posta', 'especialidad'],
    });
    // No es necesario lanzar un error si no hay consultorios.
    // Devolver un array vacío es un comportamiento estándar en API REST.
    return consultorios;
  }

  // Method to update an existing medical specialty office
  async update(id: number, data: Partial<CreateConsultorioEspecialidad>) {
    // 1. Buscamos si el consultorio existe
    const consultorio = await this.findOne(id); // findOne ya lanza NotFoundException

    // Extraemos los IDs de las relaciones para manejarlos por separado
    const { idPosta, idEspecialidad, ...updateData } = data;

    // 2. Si el DTO trae un nuevo idPosta, validamos que la posta existe y la asignamos
    if (idPosta) {
      const posta = await this.postasMedicasService.findOne(idPosta);
      if (!posta) {
        throw new NotFoundException(
          'La posta médica con ID ' + idPosta + ' no existe.',
        );
      }
      consultorio.posta = posta;
    }

    // 3. Si el DTO trae un nuevo idEspecialidad, validamos que la especialidad existe y la asignamos
    if (idEspecialidad) {
      const especialidad =
        await this.especialidadMedicaService.findOne(idEspecialidad);
      consultorio.especialidad = especialidad;
    }

    // 4. Usamos merge para copiar de forma segura el resto de los datos del DTO al consultorio.
    // Esto evita sobreescribir las relaciones que acabamos de asignar.
    this.consultorioEspecialidadRepository.merge(consultorio, updateData);

    // 5. Guardamos el consultorio actualizado en la base de datos
    return await this.consultorioEspecialidadRepository.save(consultorio);
  }

  // Method to delete a medical specialty office by its ID
  async remove(id: number) {
    // 1. Buscamos el consultorio antes de eliminarla.
    const consultorio = await this.findOne(id);

    // 2. Utilizamos softRemove para eliminar un consultorio especialidad.
    return await this.consultorioEspecialidadRepository.softRemove(consultorio);
  }
}
