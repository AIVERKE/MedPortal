import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { Administrativo } from '../modules/users/entities/administrativo.entity';
import { AsignacionRol } from '../modules/users/entities/asignacion-rol.entity';
import { Consultor } from '../modules/users/entities/consultor.entity';
import { ContratoConsultor } from '../modules/users/entities/contrato-consultor.entity';
import { Docente } from '../modules/users/entities/docente.entity';
import { Persona } from '../modules/users/entities/persona.entity';
import { Rol } from '../modules/users/entities/rol.entity';
import { Usuario } from '../modules/users/entities/usuario.entity';
import { RegistroAdministrativoDto } from './dto/registro-administrativo.dto';
import { RegistroConsultorDto } from './dto/registro-consultor.dto';
import { RegistroDocenteDto } from './dto/registro-docente.dto';
import { RegistroPersonaBaseDto } from './dto/registro-persona-base.dto';

type CaptchaPayload = {
  captcha: string;
  iat?: number;
  exp?: number;
};

type UploadedPdf = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

@Injectable()
export class RegistroPersonalService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  private validateCaptcha(captchaToken: string, captchaInput: string) {
    try {
      const secret =
        this.configService.get<string>('CAPTCHA_SECRET') ||
        this.configService.get<string>('JWT_SECRET') ||
        'secret';
      const decoded = jwt.verify(captchaToken, secret) as CaptchaPayload;

      if (decoded.captcha?.toUpperCase() !== captchaInput.toUpperCase()) {
        throw new BadRequestException('La verificación antibot no es válida.');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'La verificación antibot expiró o no es válida.',
      );
    }
  }

  private validateDatos(dto: RegistroPersonaBaseDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }
    this.validateCaptcha(dto.captchaToken, dto.captchaInput);
  }

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

  private async crearPersonaYUsuario(
    manager: any,
    dto: RegistroPersonaBaseDto,
  ) {
    const personaRepo = manager.getRepository(Persona);
    const usuarioRepo = manager.getRepository(Usuario);

    const existingPersona = await personaRepo.findOne({ where: { ci: dto.ci } });
    if (existingPersona) {
      throw new BadRequestException(`La persona con CI ${dto.ci} ya existe.`);
    }

    const existingUser = await usuarioRepo.findOne({
      where: { username: dto.ci },
      withDeleted: true,
    });
    if (existingUser) {
      throw new BadRequestException(
        'Ya existe una cuenta con ese carnet de identidad.',
      );
    }

    const persona = await personaRepo.save(
      personaRepo.create({
        ci: dto.ci,
        nombres: dto.nombres,
        primerApellido: dto.primerApellido,
        segundoApellido: dto.segundoApellido,
        fechaNacimiento: new Date(dto.fechaNacimiento),
        genero: dto.genero,
        celular: dto.celular,
        email: dto.email,
        direccion: dto.direccion,
        activo: true,
      }),
    );

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    await usuarioRepo.save(
      usuarioRepo.create({
        persona,
        username: dto.ci,
        password: hashedPassword,
      }),
    );

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

    await asignacionRepo.save(
      asignacionRepo.create({
        persona,
        rol,
        activo: true,
      }),
    );
  }

  async registrarDocente(dto: RegistroDocenteDto) {
    this.validateDatos(dto);

    return this.dataSource.transaction(async (manager) => {
      const persona = await this.crearPersonaYUsuario(manager, dto);

      const docenteRepo = manager.getRepository(Docente);
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

      await this.asignarRol(manager, persona, 'DOCENTE');

      return {
        message:
          'Registro completado. Ya puedes iniciar sesión con tu CI y contraseña.',
      };
    });
  }

  async registrarAdministrativo(dto: RegistroAdministrativoDto) {
    this.validateDatos(dto);

    return this.dataSource.transaction(async (manager) => {
      const persona = await this.crearPersonaYUsuario(manager, dto);

      const administrativoRepo = manager.getRepository(Administrativo);
      await administrativoRepo.save(
        administrativoRepo.create({
          persona,
          numeroItem: dto.numeroItem,
          unidad: dto.unidad,
          cargo: dto.cargo,
          fechaSincronizacion: new Date(),
        }),
      );

      await this.asignarRol(manager, persona, 'ADMINISTRATIVO');

      return {
        message:
          'Registro completado. Ya puedes iniciar sesión con tu CI y contraseña.',
      };
    });
  }

  async registrarConsultor(
    dto: RegistroConsultorDto,
    pdfContrato: UploadedPdf | undefined,
  ) {
    this.validateDatos(dto);

    if (!pdfContrato) {
      throw new BadRequestException('El PDF del contrato es obligatorio.');
    }
    if (pdfContrato.mimetype !== 'application/pdf') {
      throw new BadRequestException(
        'El PDF del contrato debe ser un archivo PDF.',
      );
    }
    if (pdfContrato.size > 3 * 1024 * 1024) {
      throw new BadRequestException(
        'El PDF del contrato debe pesar máximo 3MB.',
      );
    }
    const contratoUrl = this.savePdf(pdfContrato, 'contrato');

    return this.dataSource.transaction(async (manager) => {
      const persona = await this.crearPersonaYUsuario(manager, dto);

      const consultorRepo = manager.getRepository(Consultor);
      const contratoRepo = manager.getRepository(ContratoConsultor);

      const consultor = await consultorRepo.save(
        consultorRepo.create({
          persona,
          fechaSincronizacion: new Date(),
        }),
      );

      const idServicio =
        dto.tipoServicio && /^\d+$/.test(dto.tipoServicio)
          ? parseInt(dto.tipoServicio, 10)
          : undefined;

      await contratoRepo.save(
        contratoRepo.create({
          consultor,
          idServicio,
          unidad: dto.unidad,
          fechaInicioContrato: dto.fechaInicioContrato
            ? new Date(dto.fechaInicioContrato)
            : undefined,
          fechaFinContrato: dto.fechaFinContrato
            ? new Date(dto.fechaFinContrato)
            : undefined,
          cargo: dto.cargo,
          documentoContratoUrl: contratoUrl,
        }),
      );

      await this.asignarRol(manager, persona, 'CONSULTOR');

      return {
        message:
          'Registro completado. Ya puedes iniciar sesión con tu CI y contraseña.',
      };
    });
  }
}
