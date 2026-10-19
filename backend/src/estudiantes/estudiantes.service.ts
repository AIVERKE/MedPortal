import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import { Carrera } from '../modules/users/entities/carrera.entity';
import { Estudiante } from '../modules/users/entities/estudiante.entity';
import { Facultad } from '../modules/users/entities/facultad.entity';
import { Persona } from '../modules/users/entities/persona.entity';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto';

type UploadedPdf = {
    buffer: Buffer;
    mimetype: string;
    size: number;
};

const ESTUDIANTE_RELATIONS = [
    'persona',
    'facultadCatalogo',
    'carreraCatalogo',
] as const;

@Injectable()
export class EstudiantesService {
    constructor(
        @InjectRepository(Estudiante)
        private readonly estudianteRepository: Repository<Estudiante>,
        @InjectRepository(Persona)
        private readonly personaRepository: Repository<Persona>,
        @InjectRepository(Facultad)
        private readonly facultadRepository: Repository<Facultad>,
        @InjectRepository(Carrera)
        private readonly carreraRepository: Repository<Carrera>,
    ) { }

    private async resolveCatalogData(
        idFacultad?: number,
        idCarrera?: number,
    ): Promise<Partial<Estudiante>> {
        if (idFacultad === undefined && idCarrera === undefined) {
            return {};
        }

        if (idFacultad === undefined || idCarrera === undefined) {
            throw new BadRequestException(
                'Debes seleccionar facultad y carrera.',
            );
        }

        const facultad = await this.facultadRepository.findOne({
            where: { idFacultad, activo: true },
        });
        if (!facultad) {
            throw new BadRequestException(
                'La facultad seleccionada no es válida.',
            );
        }

        const carrera = await this.carreraRepository.findOne({
            where: {
                idCarrera,
                activo: true,
                facultad: { idFacultad },
            },
            relations: ['facultad'],
        });
        if (!carrera) {
            throw new BadRequestException(
                'La carrera seleccionada no corresponde a la facultad.',
            );
        }

        return {
            facultadCatalogo: facultad,
            carreraCatalogo: carrera,
            facultad: facultad.nombre,
            carrera: carrera.nombre,
        };
    }

    async create(createEstudianteDto: CreateEstudianteDto) {
        const { idPersona, idFacultad, idCarrera, ...estudianteData } =
            createEstudianteDto;

        const persona = await this.personaRepository.findOne({
            where: { idPersona },
        });
        if (!persona) {
            throw new NotFoundException(`Persona con ID ${idPersona} no encontrada.`);
        }

        const catalogData = await this.resolveCatalogData(idFacultad, idCarrera);

        const existingEstudiante = await this.estudianteRepository.findOne({
            where: { persona: { idPersona } },
            withDeleted: true,
        });

        if (existingEstudiante) {
            if (existingEstudiante.deletedAt === null) {
                throw new BadRequestException(
                    `La persona con ID ${idPersona} ya está registrada como estudiante activo.`,
                );
            }

            existingEstudiante.deletedAt = null as any;
            this.estudianteRepository.merge(
                existingEstudiante,
                estudianteData,
                catalogData,
            );
            return await this.estudianteRepository.save(existingEstudiante);
        }

        const newEstudiante = this.estudianteRepository.create({
            ...estudianteData,
            ...catalogData,
            persona,
        });

        return await this.estudianteRepository.save(newEstudiante);
    }

    async findAll() {
        return await this.estudianteRepository.find({
            relations: [...ESTUDIANTE_RELATIONS],
        });
    }

    async findOne(id: number) {
        const estudiante = await this.estudianteRepository.findOne({
            where: { idEstudiante: id },
            relations: [...ESTUDIANTE_RELATIONS],
        });
        if (!estudiante) {
            throw new NotFoundException(`Estudiante con ID ${id} no encontrado.`);
        }
        return estudiante;
    }

    async findByPersona(idPersona: number) {
        return await this.estudianteRepository.findOne({
            where: { persona: { idPersona } },
            relations: [...ESTUDIANTE_RELATIONS],
        });
    }

    async update(id: number, updateEstudianteDto: UpdateEstudianteDto) {
        const estudiante = await this.findOne(id);
        const { idPersona, idFacultad, idCarrera, ...estudianteData } =
            updateEstudianteDto;

        if (idPersona) {
            const persona = await this.personaRepository.findOne({
                where: { idPersona },
            });
            if (!persona)
                throw new NotFoundException(
                    `Persona con ID ${idPersona} no encontrada.`,
                );

            if (estudiante.persona.idPersona !== idPersona) {
                const existingEstudiante = await this.estudianteRepository.findOne({
                    where: { persona: { idPersona } },
                });
                if (existingEstudiante) {
                    throw new BadRequestException(
                        `La persona con ID ${idPersona} ya está registrada como estudiante.`,
                    );
                }
            }
            estudiante.persona = persona;
        }

        const catalogData = await this.resolveCatalogData(idFacultad, idCarrera);

        if (Object.keys(estudianteData).length > 0 || Object.keys(catalogData).length > 0) {
            this.estudianteRepository.merge(estudiante, estudianteData, catalogData);
        }

        return await this.estudianteRepository.save(estudiante);
    }

    async updateDocumentos(
        id: number,
        pdfMatricula?: UploadedPdf,
        pdfCarnet?: UploadedPdf,
    ) {
        if (!pdfMatricula && !pdfCarnet) {
            throw new BadRequestException(
                'Debes adjuntar al menos un documento PDF.',
            );
        }

        const estudiante = await this.findOne(id);
        const idPersona = estudiante.persona.idPersona;
        let documentUpdated = false;

        if (pdfMatricula) {
            if (pdfMatricula.mimetype !== 'application/pdf') {
                throw new BadRequestException('Solo se permiten archivos PDF.');
            }
            if (pdfMatricula.size > 1 * 1024 * 1024) {
                throw new BadRequestException(
                    'El PDF de matrícula debe pesar máximo 1MB.',
                );
            }
            estudiante.documentoMatriculaUrl = this.savePdf(
                pdfMatricula,
                `matricula_${idPersona}`,
            );
            documentUpdated = true;
        }

        if (pdfCarnet) {
            if (pdfCarnet.mimetype !== 'application/pdf') {
                throw new BadRequestException('Solo se permiten archivos PDF.');
            }
            if (pdfCarnet.size > 3 * 1024 * 1024) {
                throw new BadRequestException(
                    'El PDF de carnet de identidad debe pesar máximo 3MB.',
                );
            }
            estudiante.documentoCarnetUrl = this.savePdf(
                pdfCarnet,
                `carnet_${idPersona}`,
            );
            documentUpdated = true;
        }

        if (documentUpdated) {
            estudiante.fechaSincronizacion = new Date();
        }

        return await this.estudianteRepository.save(estudiante);
    }

    async remove(id: number) {
        const estudiante = await this.findOne(id);
        return await this.estudianteRepository.softRemove(estudiante);
    }

    private ensureDir(subdir: string) {
        const fullPath = path.join(process.cwd(), 'uploads', subdir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
        return fullPath;
    }

    private savePdf(file: UploadedPdf, prefix: string) {
        const uploadDir = this.ensureDir('registros');
        const safeName = `${prefix}_${Date.now()}_${Math.round(
            Math.random() * 1e9,
        )}.pdf`;
        const fullPath = path.join(uploadDir, safeName);
        fs.writeFileSync(fullPath, file.buffer);
        return `/uploads/registros/${safeName}`;
    }
}
