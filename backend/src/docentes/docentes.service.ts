import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Docente } from '../modules/users/entities/docente.entity';
import { Persona } from '../modules/users/entities/persona.entity';
import { CreateDocenteDto } from './dto/create-docente.dto';
import { UpdateDocenteDto } from './dto/update-docente.dto';

@Injectable()
export class DocentesService {
    constructor(
        @InjectRepository(Docente)
        private readonly docenteRepository: Repository<Docente>,
        @InjectRepository(Persona)
        private readonly personaRepository: Repository<Persona>,
    ) { }

    async create(createDocenteDto: CreateDocenteDto) {
        const { idPersona, ...docenteData } = createDocenteDto;

        const persona = await this.personaRepository.findOne({
            where: { idPersona },
        });
        if (!persona) {
            throw new NotFoundException(`Persona con ID ${idPersona} no encontrada.`);
        }

        const existingDocente = await this.docenteRepository.findOne({
            where: { persona: { idPersona } },
            withDeleted: true,
        });

        if (existingDocente) {
            if (existingDocente.deletedAt === null) {
                throw new BadRequestException(
                    `La persona con ID ${idPersona} ya está registrada como docente activo.`,
                );
            }

            // Restaurar docente eliminado
            existingDocente.deletedAt = null as any;
            this.docenteRepository.merge(existingDocente, docenteData);
            return await this.docenteRepository.save(existingDocente);
        }

        const newDocente = this.docenteRepository.create({
            ...docenteData,
            persona,
        });

        return await this.docenteRepository.save(newDocente);
    }

    async findAll() {
        return await this.docenteRepository.find({
            relations: ['persona'],
        });
    }

    async findOne(id: number) {
        const docente = await this.docenteRepository.findOne({
            where: { idDocente: id },
            relations: ['persona'],
        });
        if (!docente) {
            throw new NotFoundException(`Docente con ID ${id} no encontrado.`);
        }
        return docente;
    }

    async findByPersona(idPersona: number) {
        return await this.docenteRepository.findOne({
            where: { persona: { idPersona } },
            relations: ['persona'],
        });
    }

    async update(id: number, updateDocenteDto: UpdateDocenteDto) {
        const docente = await this.findOne(id);
        const { idPersona, ...docenteData } = updateDocenteDto;

        if (idPersona) {
            const persona = await this.personaRepository.findOne({
                where: { idPersona },
            });
            if (!persona)
                throw new NotFoundException(
                    `Persona con ID ${idPersona} no encontrada.`,
                );

            if (docente.persona.idPersona !== idPersona) {
                const existingDocente = await this.docenteRepository.findOne({
                    where: { persona: { idPersona } },
                });
                if (existingDocente) {
                    throw new BadRequestException(
                        `La persona con ID ${idPersona} ya está registrada como docente.`,
                    );
                }
            }
            docente.persona = persona;
        }

        if (Object.keys(docenteData).length > 0) {
            this.docenteRepository.merge(docente, docenteData);
        }

        return await this.docenteRepository.save(docente);
    }

    async remove(id: number) {
        const docente = await this.findOne(id);
        return await this.docenteRepository.softRemove(docente);
    }
}
