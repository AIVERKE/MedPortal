import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consultor } from '../modules/users/entities/consultor.entity';
import { Persona } from '../modules/users/entities/persona.entity';
import { CreateConsultorDto } from './dto/create-consultor.dto';
import { UpdateConsultorDto } from './dto/update-consultor.dto';

@Injectable()
export class ConsultoresService {
    constructor(
        @InjectRepository(Consultor)
        private readonly consultorRepository: Repository<Consultor>,
        @InjectRepository(Persona)
        private readonly personaRepository: Repository<Persona>,
    ) { }

    async create(createConsultorDto: CreateConsultorDto) {
        const { idPersona, ...consultorData } = createConsultorDto;

        const persona = await this.personaRepository.findOne({
            where: { idPersona },
        });
        if (!persona) {
            throw new NotFoundException(`Persona con ID ${idPersona} no encontrada.`);
        }

        const existingConsultor = await this.consultorRepository.findOne({
            where: { persona: { idPersona } },
            withDeleted: true,
        });

        if (existingConsultor) {
            if (existingConsultor.deletedAt === null) {
                throw new BadRequestException(
                    `La persona con ID ${idPersona} ya está registrada como consultor activo.`,
                );
            }

            // Restaurar consultor eliminado
            existingConsultor.deletedAt = null as any;
            this.consultorRepository.merge(existingConsultor, consultorData);
            return await this.consultorRepository.save(existingConsultor);
        }

        const newConsultor = this.consultorRepository.create({
            ...consultorData,
            persona,
        });

        return await this.consultorRepository.save(newConsultor);
    }

    async findAll() {
        return await this.consultorRepository.find({
            relations: ['persona'],
        });
    }

    async findOne(id: number) {
        const consultor = await this.consultorRepository.findOne({
            where: { idConsultor: id },
            relations: ['persona'],
        });
        if (!consultor) {
            throw new NotFoundException(`Consultor con ID ${id} no encontrado.`);
        }
        return consultor;
    }

    async findByPersona(idPersona: number) {
        return await this.consultorRepository.findOne({
            where: { persona: { idPersona } },
            relations: ['persona'],
        });
    }

    async update(id: number, updateConsultorDto: UpdateConsultorDto) {
        const consultor = await this.findOne(id);
        const { idPersona, ...consultorData } = updateConsultorDto;

        if (idPersona) {
            const persona = await this.personaRepository.findOne({
                where: { idPersona },
            });
            if (!persona)
                throw new NotFoundException(
                    `Persona con ID ${idPersona} no encontrada.`,
                );

            if (consultor.persona.idPersona !== idPersona) {
                const existingConsultor = await this.consultorRepository.findOne({
                    where: { persona: { idPersona } },
                });
                if (existingConsultor) {
                    throw new BadRequestException(
                        `La persona con ID ${idPersona} ya está registrada como consultor.`,
                    );
                }
            }
            consultor.persona = persona;
        }

        if (Object.keys(consultorData).length > 0) {
            this.consultorRepository.merge(consultor, consultorData);
        }

        return await this.consultorRepository.save(consultor);
    }

    async remove(id: number) {
        const consultor = await this.findOne(id);
        return await this.consultorRepository.softRemove(consultor);
    }
}
