import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import { Persona } from '../modules/users/entities/persona.entity';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

type UploadedImage = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname?: string;
};

@Injectable()
export class PersonasService {
  constructor(
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
  ) { }

  async create(createPersonaDto: CreatePersonaDto) {
    const existingPersona = await this.personaRepository.findOne({
      where: { ci: createPersonaDto.ci },
    });
    if (existingPersona) {
      throw new BadRequestException(
        `La persona con CI ${createPersonaDto.ci} ya existe.`,
      );
    }

    const nuevaPersona = this.personaRepository.create(createPersonaDto);
    return await this.personaRepository.save(nuevaPersona);
  }

  async findAll() {
    return await this.personaRepository.find({
      order: {
        idPersona: 'ASC',
      },
    });
  }

  async findSinUsuario() {
    return await this.personaRepository
      .createQueryBuilder('persona')
      .leftJoinAndSelect('persona.asignacionesRoles', 'asignacionesRoles')
      .leftJoinAndSelect('asignacionesRoles.rol', 'rol')
      .leftJoin('persona.usuario', 'usuario')
      .where('usuario.id_usuario IS NULL')
      .orderBy('persona.idPersona', 'ASC')
      .getMany();
  }

  async findConUsuario() {
    return await this.personaRepository
      .createQueryBuilder('persona')
      .leftJoinAndSelect('persona.asignacionesRoles', 'asignacionesRoles')
      .leftJoinAndSelect('asignacionesRoles.rol', 'rol')
      .innerJoinAndSelect('persona.usuario', 'usuario')
      .orderBy('persona.idPersona', 'ASC')
      .getMany();
  }

  async findOne(id: number) {
    const persona = await this.personaRepository.findOne({
      where: { idPersona: id },
    });
    if (!persona) {
      throw new NotFoundException(`Persona con ID ${id} no encontrada.`);
    }
    return persona;
  }

  async update(id: number, updatePersonaDto: UpdatePersonaDto) {
    const persona = await this.findOne(id);

    if (updatePersonaDto.ci && updatePersonaDto.ci !== persona.ci) {
      const existingPersona = await this.personaRepository.findOne({
        where: { ci: updatePersonaDto.ci },
      });
      if (existingPersona) {
        throw new BadRequestException(
          `Ya existe otra persona con el CI ${updatePersonaDto.ci}.`,
        );
      }
    }

    this.personaRepository.merge(persona, updatePersonaDto);
    return await this.personaRepository.save(persona);
  }

  async remove(id: number) {
    const persona = await this.findOne(id);
    return await this.personaRepository.softRemove(persona);
  }

  async updateStatus(id: number, activo: boolean) {
    const persona = await this.findOne(id);
    persona.activo = activo;
    return await this.personaRepository.save(persona);
  }

  async updateFoto(id: number, file: UploadedImage) {
    if (!file) {
      throw new BadRequestException('Debes adjuntar una imagen.');
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        'Solo se permiten imágenes JPG, PNG o WEBP.',
      );
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('La imagen debe pesar máximo 2MB.');
    }

    const persona = await this.findOne(id);
    const ext = this.resolveImageExtension(file.mimetype, file.originalname);
    persona.foto = this.saveImage(file, id, ext);
    await this.personaRepository.save(persona);

    return {
      message: 'Foto de perfil actualizada correctamente.',
      foto: persona.foto,
    };
  }

  private resolveImageExtension(mimetype: string, originalname?: string) {
    if (mimetype === 'image/png') return '.png';
    if (mimetype === 'image/webp') return '.webp';
    if (originalname) {
      const ext = path.extname(originalname).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return ext;
    }
    return '.jpg';
  }

  private ensureDir(subdir: string) {
    const fullPath = path.join(process.cwd(), 'uploads', subdir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    return fullPath;
  }

  private saveImage(file: UploadedImage, idPersona: number, ext: string) {
    const uploadDir = this.ensureDir('perfiles');
    const safeName = `foto_${idPersona}_${Date.now()}${ext}`;
    const fullPath = path.join(uploadDir, safeName);
    fs.writeFileSync(fullPath, file.buffer);
    return `/uploads/perfiles/${safeName}`;
  }
}
