import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import { DataSource, Repository } from 'typeorm';
import { AsignacionRol } from '../modules/users/entities/asignacion-rol.entity';
import { Carrera } from '../modules/users/entities/carrera.entity';
import { Estudiante } from '../modules/users/entities/estudiante.entity';
import { Facultad } from '../modules/users/entities/facultad.entity';
import { Persona } from '../modules/users/entities/persona.entity';
import { Rol } from '../modules/users/entities/rol.entity';
import { Usuario } from '../modules/users/entities/usuario.entity';
import { RegistroEstudianteDto } from './dto/registro-estudiante.dto';

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
export class RegistroEstudianteService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    @InjectRepository(Facultad)
    private readonly facultadRepository: Repository<Facultad>,
    @InjectRepository(Carrera)
    private readonly carreraRepository: Repository<Carrera>,
  ) {}

  generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let captcha = '';
    for (let i = 0; i < 5; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const secret =
      this.configService.get<string>('CAPTCHA_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'secret';
    const token = jwt.sign({ captcha }, secret, {
      expiresIn: '5m',
    });

    return { captchaText: captcha, captchaToken: token };
  }

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
      throw new BadRequestException('La verificación antibot expiró o no es válida.');
    }
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

  async registrarEstudiante(
    dto: RegistroEstudianteDto,
    pdfMatricula: UploadedPdf | undefined,
    pdfCarnet: UploadedPdf | undefined,
  ) {
    if (!pdfMatricula || !pdfCarnet) {
      throw new BadRequestException(
        'Debes adjuntar ambos PDFs: matrícula y carnet de identidad.',
      );
    }
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }

    this.validateCaptcha(dto.captchaToken, dto.captchaInput);

    const facultad = await this.facultadRepository.findOne({
      where: { idFacultad: dto.idFacultad, activo: true },
    });
    if (!facultad) {
      throw new BadRequestException('La facultad seleccionada no es válida.');
    }

    const carrera = await this.carreraRepository.findOne({
      where: { idCarrera: dto.idCarrera, activo: true, facultad: { idFacultad: dto.idFacultad } },
      relations: ['facultad'],
    });
    if (!carrera) {
      throw new BadRequestException('La carrera seleccionada no corresponde a la facultad.');
    }

    return this.dataSource.transaction(async (manager) => {
      const personaRepo = manager.getRepository(Persona);
      const estudianteRepo = manager.getRepository(Estudiante);
      const usuarioRepo = manager.getRepository(Usuario);
      const rolRepo = manager.getRepository(Rol);
      const asignacionRepo = manager.getRepository(AsignacionRol);

      const existingPersona = await personaRepo.findOne({ where: { ci: dto.ci } });
      if (existingPersona) {
        throw new BadRequestException(`La persona con CI ${dto.ci} ya existe.`);
      }

      const existingRu = await estudianteRepo.findOne({
        where: { registroUniversitario: dto.registroUniversitario },
      });
      if (existingRu) {
        throw new BadRequestException('El registro universitario ya está registrado.');
      }

      const existingUser = await usuarioRepo.findOne({
        where: { username: dto.ci },
        withDeleted: true,
      });
      if (existingUser) {
        throw new BadRequestException('Ya existe una cuenta con ese carnet de identidad.');
      }

      const matriculaUrl = this.savePdf(pdfMatricula, 'matricula');
      const carnetUrl = this.savePdf(pdfCarnet, 'carnet');

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

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      await usuarioRepo.save(
        usuarioRepo.create({
          persona,
          username: dto.ci,
          password: hashedPassword,
        }),
      );

      const rolEstudiante = await rolRepo.findOne({ where: { nombre: 'ESTUDIANTE' } });
      if (!rolEstudiante) {
        throw new InternalServerErrorException(
          'No se encontró el rol ESTUDIANTE en el sistema.',
        );
      }

      await asignacionRepo.save(
        asignacionRepo.create({
          persona,
          rol: rolEstudiante,
          activo: true,
        }),
      );

      return {
        message:
          'Registro completado. Ya puedes iniciar sesión con tu CI y contraseña.',
      };
    });
  }
}
