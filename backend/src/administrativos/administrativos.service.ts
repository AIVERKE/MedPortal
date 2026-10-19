import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Administrativo } from '../modules/users/entities/administrativo.entity';
import { Persona } from '../modules/users/entities/persona.entity';
import { CreateAdministrativoDto } from './dto/create-administrativo.dto';
import { UpdateAdministrativoDto } from './dto/update-administrativo.dto';

@Injectable()
export class AdministrativosService {
  constructor(
    @InjectRepository(Administrativo)
    private readonly administrativoRepo: Repository<Administrativo>,
    @InjectRepository(Persona)
    private readonly personaRepo: Repository<Persona>,
  ) { }

  async create(createDto: CreateAdministrativoDto): Promise<Administrativo> {
    const { idPersona, ...administrativoData } = createDto;

    const persona = await this.personaRepo.findOne({
      where: { idPersona },
    });
    if (!persona) {
      throw new NotFoundException(`Persona con ID ${idPersona} no encontrada.`);
    }

    const existingAdministrativo = await this.administrativoRepo.findOne({
      where: { persona: { idPersona } },
      withDeleted: true,
    });

    if (existingAdministrativo) {
      if (existingAdministrativo.deletedAt === null) {
        throw new BadRequestException(
          `La persona con ID ${idPersona} ya está registrada como administrativo activo.`,
        );
      }

      // Restaurar administrativo eliminado
      existingAdministrativo.deletedAt = null as any;
      this.administrativoRepo.merge(existingAdministrativo, administrativoData);
      return await this.administrativoRepo.save(existingAdministrativo);
    }

    const administrativo = this.administrativoRepo.create({
      ...administrativoData,
      persona,
    });

    return await this.administrativoRepo.save(administrativo);
  }

  async findAll(): Promise<Administrativo[]> {
    return await this.administrativoRepo.find({ relations: ['persona'] });
  }

  async findOne(id: number): Promise<Administrativo> {
    const administrativo = await this.administrativoRepo.findOne({
      where: { idAdministrativo: id },
      relations: ['persona'],
    });

    if (!administrativo) {
      throw new NotFoundException(`No se encontró el administrativo con ID: ${id}`);
    }

    return administrativo;
  }

  async findByPersona(idPersona: number): Promise<Administrativo | null> {
    return await this.administrativoRepo.findOne({
      where: { persona: { idPersona } },
      relations: ['persona'],
    });
  }

  async update(id: number, updateDto: UpdateAdministrativoDto): Promise<Administrativo> {
    const administrativo = await this.findOne(id);
    const { idPersona, ...administrativoData } = updateDto;

    if (idPersona) {
      const persona = await this.personaRepo.findOne({
        where: { idPersona },
      });
      if (!persona)
        throw new NotFoundException(`Persona con ID ${idPersona} no encontrada.`);

      if (administrativo.persona.idPersona !== idPersona) {
        const existingAdministrativo = await this.administrativoRepo.findOne({
          where: { persona: { idPersona } },
        });
        if (existingAdministrativo) {
          throw new BadRequestException(
            `La persona con ID ${idPersona} ya está registrada como administrativo.`,
          );
        }
      }
      administrativo.persona = persona;
    }

    if (Object.keys(administrativoData).length > 0) {
      this.administrativoRepo.merge(administrativo, administrativoData);
    }

    try {
      return await this.administrativoRepo.save(administrativo);
    } catch (error) {
      console.error('Error al actualizar administrativo:', error);
      throw new InternalServerErrorException('No se pudo actualizar el registro administrativo.');
    }
  }

  async remove(id: number): Promise<void> {
    const administrativo = await this.findOne(id);
    try {
      await this.administrativoRepo.softRemove(administrativo);
    } catch (error) {
      console.error('Error al eliminar administrativo:', error);
      throw new InternalServerErrorException('Error al intentar realizar el borrado lógico del administrativo.');
    }
  }
}
