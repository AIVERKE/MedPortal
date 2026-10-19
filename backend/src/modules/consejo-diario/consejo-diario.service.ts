import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateConsejoDiarioDto } from './dto/create-consejo-diario.dto';
import { UpdateConsejoDiarioDto } from './dto/update-consejo-diario.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ConsejoDiario } from './entities/consejo-diario.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ConsejoDiarioService {
  constructor(
    @InjectRepository(ConsejoDiario)
    private consejoDiarioRepository: Repository<ConsejoDiario>,
  ) {}

  async create(createConsejoDiarioDto: CreateConsejoDiarioDto) {
    const newConsejo = this.consejoDiarioRepository.create(
      createConsejoDiarioDto,
    );
    return await this.consejoDiarioRepository.save(newConsejo);
  }

  async findAll() {
    return await this.consejoDiarioRepository.find();
  }

  async findOne(id: number) {
    const consejo = await this.consejoDiarioRepository.findOne({
      where: { idConsejoDiario: id },
    });
    if (!consejo) {
      throw new NotFoundException(`Consejo with id ${id} not found`);
    }
    return consejo;
  }

  async update(id: number, updateConsejoDiarioDto: UpdateConsejoDiarioDto) {
    const consejo = await this.findOne(id);
    const updatedConsejo = Object.assign(consejo, updateConsejoDiarioDto);
    return await this.consejoDiarioRepository.save(updatedConsejo);
  }

  async remove(id: number) {
    const consejo = await this.findOne(id);
    return await this.consejoDiarioRepository.remove(consejo);
  }

  async getRandomConsejo() {
    const consejo = await this.consejoDiarioRepository
      .createQueryBuilder('consejo_diario')
      .where('consejo_diario.activo = :activo', { activo: true })
      .orderBy('RANDOM()')
      .getOne();

    if (!consejo) {
      throw new NotFoundException(`No consejos available`);
    }
    return consejo;
  }
}
