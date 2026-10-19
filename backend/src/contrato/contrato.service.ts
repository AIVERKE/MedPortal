import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import { ContratoConsultor } from '../modules/users/entities/contrato-consultor.entity';
import { Consultor } from '../modules/users/entities/consultor.entity';
import { CreateContrato } from './dto/create-contrato/create-contrato';
import { UpdateContrato } from './dto/update-contrato/update-contrato.dto';

type AuthUser = {
  idPersona?: number;
  rol?: string;
};

type UploadedPdf = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

const ADMIN_ROLES = ['SUPERUSUARIO', 'DIRECTOR'];
const PDF_MAX_BYTES = 3 * 1024 * 1024;

@Injectable()
export class ContratoService {
  constructor(
    @InjectRepository(ContratoConsultor)
    private readonly contratoRepository: Repository<ContratoConsultor>,
    @InjectRepository(Consultor)
    private readonly consultorRepository: Repository<Consultor>,
    private readonly configService: ConfigService,
  ) {}

  private isAdmin(user?: AuthUser) {
    return !!user?.rol && ADMIN_ROLES.includes(user.rol);
  }

  private assertCanAccessPersona(user: AuthUser, idPersona?: number) {
    if (this.isAdmin(user)) return;
    if (
      user?.rol === 'CONSULTOR' &&
      user.idPersona &&
      idPersona &&
      user.idPersona === idPersona
    ) {
      return;
    }
    throw new ForbiddenException(
      'No tienes permiso para gestionar estos contratos.',
    );
  }

  private async assertCanAccessConsultor(user: AuthUser, idConsultor: number) {
    if (this.isAdmin(user)) return;
    const consultor = await this.consultorRepository.findOne({
      where: { idConsultor },
      relations: ['persona'],
    });
    if (!consultor) {
      throw new NotFoundException(
        `Consultor con ID ${idConsultor} no encontrado.`,
      );
    }
    this.assertCanAccessPersona(user, consultor.persona?.idPersona);
  }

  private async assertCanAccessContrato(
    user: AuthUser,
    contrato: ContratoConsultor,
  ) {
    if (this.isAdmin(user)) return;
    let idPersona: number | undefined = contrato.consultor?.persona?.idPersona;
    if (!idPersona && contrato.consultor?.idConsultor) {
      const consultor = await this.consultorRepository.findOne({
        where: { idConsultor: contrato.consultor.idConsultor },
        relations: ['persona'],
      });
      idPersona = consultor?.persona?.idPersona;
    }
    this.assertCanAccessPersona(user, idPersona);
  }

  private ensureUploadsDir() {
    const uploadDir =
      this.configService.get<string>('UPLOAD_DIR') ||
      path.join(process.cwd(), 'uploads', 'registros');
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

  private resolvePdfUrl(
    file: UploadedPdf | undefined,
    existingUrl: string | undefined,
    required: boolean,
  ) {
    if (file) {
      if (file.mimetype !== 'application/pdf') {
        throw new BadRequestException(
          'El PDF del contrato debe ser un archivo PDF.',
        );
      }
      if (file.size > PDF_MAX_BYTES) {
        throw new BadRequestException(
          'El PDF del contrato debe pesar máximo 3MB.',
        );
      }
      return this.savePdf(file, 'contrato');
    }
    if (existingUrl) return existingUrl;
    if (required) {
      throw new BadRequestException('El PDF del contrato es obligatorio.');
    }
    return undefined;
  }

  async create(
    data: CreateContrato,
    user: AuthUser,
    pdfContrato?: UploadedPdf,
  ) {
    await this.assertCanAccessConsultor(user, data.idConsultor);

    const consultor = await this.consultorRepository.findOne({
      where: { idConsultor: data.idConsultor },
    });
    if (!consultor) {
      throw new NotFoundException(
        `Consultor con ID ${data.idConsultor} no encontrado.`,
      );
    }

    const documentoContratoUrl = this.resolvePdfUrl(
      pdfContrato,
      data.documentoContratoUrl,
      true,
    );

    const newContrato = this.contratoRepository.create({
      consultor,
      idServicio: data.idServicio,
      unidad: data.unidad,
      cargo: data.cargo,
      fechaInicioContrato: new Date(data.fechaInicioContrato),
      fechaFinContrato: data.fechaFinContrato
        ? new Date(data.fechaFinContrato)
        : undefined,
      documentoContratoUrl,
    });
    return await this.contratoRepository.save(newContrato);
  }

  async findAll(user: AuthUser) {
    if (!this.isAdmin(user)) {
      throw new ForbiddenException(
        'No tienes permiso para listar todos los contratos.',
      );
    }
    return await this.contratoRepository.find({
      relations: ['consultor'],
    });
  }

  async findOne(id: number, user?: AuthUser) {
    const contrato = await this.contratoRepository.findOne({
      where: { idContratoConsultor: id },
      relations: ['consultor', 'consultor.persona'],
    });
    if (!contrato) {
      throw new NotFoundException(`Contrato con ID ${id} no encontrado`);
    }
    if (user) {
      await this.assertCanAccessContrato(user, contrato);
    }
    return contrato;
  }

  async findByPersona(idPersona: number, user: AuthUser) {
    this.assertCanAccessPersona(user, idPersona);
    return await this.contratoRepository.find({
      where: { consultor: { persona: { idPersona } } },
      relations: ['consultor'],
      order: { fechaInicioContrato: 'DESC' },
    });
  }

  async update(
    id: number,
    data: UpdateContrato,
    user: AuthUser,
    pdfContrato?: UploadedPdf,
  ) {
    const contrato = await this.findOne(id, user);

    if (data.idConsultor) {
      await this.assertCanAccessConsultor(user, data.idConsultor);
      const consultor = await this.consultorRepository.findOne({
        where: { idConsultor: data.idConsultor },
      });
      if (!consultor) {
        throw new NotFoundException(
          `Consultor con ID ${data.idConsultor} no encontrado.`,
        );
      }
      contrato.consultor = consultor;
    }

    if (data.fechaInicioContrato) {
      contrato.fechaInicioContrato = new Date(data.fechaInicioContrato);
    }
    if (data.fechaFinContrato) {
      contrato.fechaFinContrato = new Date(data.fechaFinContrato);
    }
    if (data.unidad !== undefined) contrato.unidad = data.unidad;
    if (data.cargo !== undefined) contrato.cargo = data.cargo;
    if (data.idServicio !== undefined) contrato.idServicio = data.idServicio;

    const newUrl = this.resolvePdfUrl(
      pdfContrato,
      data.documentoContratoUrl,
      false,
    );
    if (newUrl) {
      contrato.documentoContratoUrl = newUrl;
    }

    return await this.contratoRepository.save(contrato);
  }

  async remove(id: number, user: AuthUser) {
    const contrato = await this.findOne(id, user);
    return await this.contratoRepository.softRemove(contrato);
  }
}
