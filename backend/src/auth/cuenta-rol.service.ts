import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource, Repository } from 'typeorm';
import { Administrativo } from '../modules/users/entities/administrativo.entity';
import { AsignacionRol } from '../modules/users/entities/asignacion-rol.entity';
import { Carrera } from '../modules/users/entities/carrera.entity';
import { Consultor } from '../modules/users/entities/consultor.entity';
import { ContratoConsultor } from '../modules/users/entities/contrato-consultor.entity';
import { Docente } from '../modules/users/entities/docente.entity';
import { Estudiante } from '../modules/users/entities/estudiante.entity';
import { Facultad } from '../modules/users/entities/facultad.entity';
import { Persona } from '../modules/users/entities/persona.entity';
import { Rol } from '../modules/users/entities/rol.entity';
import {
  CuentaRolAdministrativoDto,
  CuentaRolConsultorDto,
  CuentaRolDocenteDto,
  CuentaRolEstudianteDto,
} from './dto/cuenta-rol.dto';

type UploadedPdf = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

@Injectable()
export class CuentaRolService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    @InjectRepository(Facultad)
    private readonly facultadRepository: Repository<Facultad>,
    @InjectRepository(Carrera)
    private readonly carreraRepository: Repository<Carrera>,
  ) {}

  private ensureUploadsDir() {
    const uploadDir =
      this.configService.get<string>('UPLOAD_DIR') || './uploads/registros';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
  }

  private savePdf(file: UploadedPdf, prefix: string) {
    const uploadDir = this.ensureUploadsDir();
    const safeName = `${prefix}_${Date.now()}_${Math.round(
      Math.random() * 1e9,
    )}.pdf`;
    const fullPath = path.join(uploadDir, safeName);
    fs.writeFileSync(fullPath, file.buffer);
    return `/uploads/registros/${safeName}`;
  }

  private assertPdf(
    file: UploadedPdf | undefined,
    label: string,
    maxBytes: number,
  ) {
    if (!file) {
      throw new BadRequestException(`${label} es obligatorio.`);
    }
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException(`${label} debe ser un archivo PDF.`);
    }
    if (file.size > maxBytes) {
      const maxMb = maxBytes / (1024 * 1024);
      throw new BadRequestException(
        `${label} debe pesar máximo ${maxMb}MB.`,
      );
    }
  }

  private async getPersona(manager: any, idPersona: number) {
    const personaRepo = manager.getRepository(Persona);
    const persona = await personaRepo.findOne({ where: { idPersona } });
    if (!persona) {
      throw new NotFoundException('Persona no encontrada.');
    }
    return persona;
  }

  private async asignarRol(manager: any, persona: Persona, nombreRol: string) {
    const rolRepo = manager.getRepository(Rol);
    const asignacionRepo = manager.getRepository(AsignacionRol);

    const rol = await rolRepo.findOne({ where: { nombre: nombreRol } });
    if (!rol) {
      throw new InternalServerErrorException(
        `No se encontró el rol ${nombreRol} en el sistema.`,
      );
    }

    const existing = await asignacionRepo.findOne({
      where: {
        persona: { idPersona: persona.idPersona },
        rol: { idRol: rol.idRol },
      },
    });
    if (existing) {
      if (!existing.activo) {
        existing.activo = true;
        await asignacionRepo.save(existing);
      }
      return rol;
    }

    await asignacionRepo.save(
      asignacionRepo.create({
        persona,
        rol,
        activo: true,
      }),
    );
    return rol;
  }

  async registrarEstudiante(
    idPersona: number,
    dto: CuentaRolEstudianteDto,
    pdfMatricula?: UploadedPdf,
    pdfCarnet?: UploadedPdf,
  ) {
    this.assertPdf(pdfMatricula, 'El PDF de matrícula', 1 * 1024 * 1024);
    this.assertPdf(pdfCarnet, 'El PDF de carnet', 3 * 1024 * 1024);

    const facultad = await this.facultadRepository.findOne({
      where: { idFacultad: dto.idFacultad, activo: true },
    });
    if (!facultad) {
      throw new BadRequestException('La facultad seleccionada no es válida.');
    }

    const carrera = await this.carreraRepository.findOne({
      where: {
        idCarrera: dto.idCarrera,
        activo: true,
        facultad: { idFacultad: dto.idFacultad },
      },
      relations: ['facultad'],
    });
    if (!carrera) {
      throw new BadRequestException(
        'La carrera seleccionada no corresponde a la facultad.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const persona = await this.getPersona(manager, idPersona);
      const estudianteRepo = manager.getRepository(Estudiante);

      const existing = await estudianteRepo.findOne({
        where: { persona: { idPersona } },
        withDeleted: true,
      });
      if (existing && !existing.deletedAt) {
        throw new BadRequestException('Ya tienes datos de estudiante.');
      }

      const existingRu = await estudianteRepo.findOne({
        where: { registroUniversitario: dto.registroUniversitario },
        relations: ['persona'],
      });
      if (existingRu && existingRu.persona?.idPersona !== idPersona) {
        throw new BadRequestException(
          'El registro universitario ya está registrado.',
        );
      }

      const matriculaUrl = this.savePdf(pdfMatricula!, 'matricula');
      const carnetUrl = this.savePdf(pdfCarnet!, 'carnet');

      if (existing?.deletedAt) {
        existing.deletedAt = null as any;
        existing.registroUniversitario = dto.registroUniversitario;
        existing.carrera = carrera.nombre;
        existing.facultad = facultad.nombre;
        existing.carreraCatalogo = carrera;
        existing.facultadCatalogo = facultad;
        existing.documentoMatriculaUrl = matriculaUrl;
        existing.documentoCarnetUrl = carnetUrl;
        existing.fechaSincronizacion = new Date();
        existing.activo = true;
        existing.estadoAcademico = 'Regular';
        await estudianteRepo.save(existing);
      } else {
        await estudianteRepo.save(
          estudianteRepo.create({
            persona,
            registroUniversitario: dto.registroUniversitario,
            carrera: carrera.nombre,
            facultad: facultad.nombre,
            carreraCatalogo: carrera,
            facultadCatalogo: facultad,
            documentoMatriculaUrl: matriculaUrl,
            documentoCarnetUrl: carnetUrl,
            fechaSincronizacion: new Date(),
            activo: true,
            estadoAcademico: 'Regular',
          }),
        );
      }

      const rol = await this.asignarRol(manager, persona, 'ESTUDIANTE');
      return {
        message: 'Datos de estudiante registrados correctamente.',
        idRol: rol.idRol,
        nombreRol: rol.nombre,
      };
    });
  }

  async registrarDocente(idPersona: number, dto: CuentaRolDocenteDto) {
    return this.dataSource.transaction(async (manager) => {
      const persona = await this.getPersona(manager, idPersona);
      const docenteRepo = manager.getRepository(Docente);

      const existing = await docenteRepo.findOne({
        where: { persona: { idPersona } },
        withDeleted: true,
      });
      if (existing && !existing.deletedAt) {
        throw new BadRequestException('Ya tienes datos de docente.');
      }

      if (existing?.deletedAt) {
        existing.deletedAt = null as any;
        existing.numeroItem = dto.numeroItem;
        existing.facultad = dto.facultad;
        existing.interinoContratado = dto.interinoContratado;
        existing.fechaSincronizacion = new Date();
        existing.activo = true;
        await docenteRepo.save(existing);
      } else {
        await docenteRepo.save(
          docenteRepo.create({
            persona,
            numeroItem: dto.numeroItem,
            facultad: dto.facultad,
            interinoContratado: dto.interinoContratado,
            fechaSincronizacion: new Date(),
            activo: true,
          }),
        );
      }

      const rol = await this.asignarRol(manager, persona, 'DOCENTE');
      return {
        message: 'Datos de docente registrados correctamente.',
        idRol: rol.idRol,
        nombreRol: rol.nombre,
      };
    });
  }

  async registrarAdministrativo(
    idPersona: number,
    dto: CuentaRolAdministrativoDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const persona = await this.getPersona(manager, idPersona);
      const adminRepo = manager.getRepository(Administrativo);

      const existing = await adminRepo.findOne({
        where: { persona: { idPersona } },
        withDeleted: true,
      });
      if (existing && !existing.deletedAt) {
        throw new BadRequestException('Ya tienes datos de administrativo.');
      }

      if (existing?.deletedAt) {
        existing.deletedAt = null as any;
        existing.numeroItem = dto.numeroItem;
        existing.unidad = dto.unidad;
        existing.cargo = dto.cargo;
        existing.fechaSincronizacion = new Date();
        existing.estadoLaboral = 'Activo';
        await adminRepo.save(existing);
      } else {
        await adminRepo.save(
          adminRepo.create({
            persona,
            numeroItem: dto.numeroItem,
            unidad: dto.unidad,
            cargo: dto.cargo,
            fechaSincronizacion: new Date(),
            estadoLaboral: 'Activo',
          }),
        );
      }

      const rol = await this.asignarRol(manager, persona, 'ADMINISTRATIVO');
      return {
        message: 'Datos de administrativo registrados correctamente.',
        idRol: rol.idRol,
        nombreRol: rol.nombre,
      };
    });
  }

  async registrarConsultor(
    idPersona: number,
    dto: CuentaRolConsultorDto,
    pdfContrato?: UploadedPdf,
  ) {
    this.assertPdf(pdfContrato, 'El PDF del contrato', 3 * 1024 * 1024);
    const contratoUrl = this.savePdf(pdfContrato!, 'contrato');

    return this.dataSource.transaction(async (manager) => {
      const persona = await this.getPersona(manager, idPersona);
      const consultorRepo = manager.getRepository(Consultor);
      const contratoRepo = manager.getRepository(ContratoConsultor);

      let consultor = await consultorRepo.findOne({
        where: { persona: { idPersona } },
        withDeleted: true,
      });
      if (consultor && !consultor.deletedAt) {
        // Already has consultor — still allow? Plan says validate not already. Block.
        throw new BadRequestException('Ya tienes datos de consultor.');
      }

      if (consultor?.deletedAt) {
        consultor.deletedAt = null as any;
        consultor.fechaSincronizacion = new Date();
        consultor = await consultorRepo.save(consultor);
      } else {
        consultor = await consultorRepo.save(
          consultorRepo.create({
            persona,
            fechaSincronizacion: new Date(),
          }),
        );
      }

      const idServicio =
        dto.tipoServicio && /^\d+$/.test(dto.tipoServicio)
          ? parseInt(dto.tipoServicio, 10)
          : undefined;

      await contratoRepo.save(
        contratoRepo.create({
          consultor,
          idServicio,
          unidad: dto.unidad,
          fechaInicioContrato: new Date(dto.fechaInicioContrato),
          fechaFinContrato: dto.fechaFinContrato
            ? new Date(dto.fechaFinContrato)
            : undefined,
          cargo: dto.cargo,
          documentoContratoUrl: contratoUrl,
        }),
      );

      const rol = await this.asignarRol(manager, persona, 'CONSULTOR');
      return {
        message: 'Datos de consultor registrados correctamente.',
        idRol: rol.idRol,
        nombreRol: rol.nombre,
      };
    });
  }
}
