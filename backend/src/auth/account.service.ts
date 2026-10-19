import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { In, IsNull, MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Usuario } from '../modules/users/entities/usuario.entity';
import { Persona } from '../modules/users/entities/persona.entity';
import { Estudiante } from '../modules/users/entities/estudiante.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { MailService } from '../modules/mail/mail.service';

type UploadedFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname?: string;
};

const GENERIC_FORGOT_MESSAGE =
  'Si el usuario existe y tiene un correo registrado, enviaremos instrucciones para restablecer la contraseña.';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(Estudiante)
    private readonly estudianteRepository: Repository<Estudiante>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async updateProfile(idPersona: number, dto: UpdateProfileDto) {
    const persona = await this.personaRepository.findOne({
      where: { idPersona },
    });
    if (!persona) {
      throw new NotFoundException('Persona no encontrada.');
    }

    persona.nombres = dto.nombres.trim();
    persona.primerApellido = dto.primerApellido.trim();
    persona.segundoApellido = dto.segundoApellido?.trim() || '';
    persona.genero = dto.genero?.trim() || '';
    persona.celular = dto.celular?.trim() || '';
    persona.email = dto.email?.trim() || '';
    persona.direccion = dto.direccion?.trim() || '';

    await this.personaRepository.save(persona);

    return {
      message: 'Datos personales actualizados correctamente.',
      persona: {
        nombres: persona.nombres,
        primerApellido: persona.primerApellido,
        segundoApellido: persona.segundoApellido,
        genero: persona.genero,
        celular: persona.celular,
        email: persona.email,
        direccion: persona.direccion,
      },
    };
  }

  async checkUsernameAvailability(idUsuario: number, rawUsername: string) {
    const username = rawUsername?.trim() || '';
    if (!username) {
      return {
        available: false,
        username,
        suggestions: [] as string[],
        message: 'El usuario es requerido.',
      };
    }
    if (username.length < 3) {
      return {
        available: false,
        username,
        suggestions: [] as string[],
        message: 'Mínimo 3 caracteres.',
      };
    }
    if (username.length > 50) {
      return {
        available: false,
        username,
        suggestions: [] as string[],
        message: 'Máximo 50 caracteres.',
      };
    }

    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario },
      relations: ['persona'],
    });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    if (usuario.username === username) {
      return { available: true, username, suggestions: [] as string[] };
    }

    const existing = await this.usuarioRepository.findOne({
      where: { username },
    });
    if (!existing || existing.idUsuario === idUsuario) {
      return { available: true, username, suggestions: [] as string[] };
    }

    const suggestions = await this.findAvailableUsernameSuggestions(
      username,
      usuario,
    );
    return {
      available: false,
      username,
      suggestions,
      message: 'Ese nombre de usuario ya está en uso.',
    };
  }

  async updateUsername(idUsuario: number, dto: UpdateUsernameDto) {
    const username = dto.username.trim();
    if (!username) {
      throw new BadRequestException('El usuario es requerido.');
    }

    const check = await this.checkUsernameAvailability(idUsuario, username);
    if (check.available) {
      const usuario = await this.usuarioRepository.findOne({
        where: { idUsuario },
      });
      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado.');
      }
      if (usuario.username === username) {
        return { message: 'El usuario no cambió.', username: usuario.username };
      }

      usuario.username = username;
      await this.usuarioRepository.save(usuario);

      return {
        message: 'Usuario actualizado correctamente.',
        username: usuario.username,
      };
    }

    throw new BadRequestException({
      message: check.message || 'Ese nombre de usuario ya está en uso.',
      suggestions: check.suggestions,
    });
  }

  private async findAvailableUsernameSuggestions(
    desired: string,
    usuario: Usuario,
  ): Promise<string[]> {
    const candidates = this.buildUsernameCandidates(desired, usuario.persona);
    if (!candidates.length) return [];

    const taken = await this.usuarioRepository.find({
      where: { username: In(candidates) },
      select: ['idUsuario', 'username'],
    });
    const takenSet = new Set(
      taken
        .filter((row) => row.idUsuario !== usuario.idUsuario)
        .map((row) => row.username),
    );

    return candidates
      .filter(
        (candidate) =>
          !takenSet.has(candidate) && candidate !== usuario.username,
      )
      .slice(0, 5);
  }

  private buildUsernameCandidates(
    desired: string,
    persona?: Persona | null,
  ): string[] {
    const base = desired.trim();
    const year = String(new Date().getFullYear()).slice(-2);
    const seen = new Set<string>([base]);
    const candidates: string[] = [];

    const push = (value: string) => {
      const clipped = this.clipUsername(value);
      if (!clipped || seen.has(clipped)) return;
      seen.add(clipped);
      candidates.push(clipped);
    };

    for (let i = 1; i <= 15; i++) {
      const prefix = base.slice(0, Math.max(3, 50 - String(i).length));
      push(`${prefix}${i}`);
    }
    push(`${base.slice(0, 48)}${year}`);
    push(`${base.slice(0, 47)}_${year}`);

    const first = this.slugifyUsernamePart(persona?.nombres?.split(/\s+/)[0]);
    const last = this.slugifyUsernamePart(persona?.primerApellido);
    const second = this.slugifyUsernamePart(persona?.segundoApellido);
    if (first && last) {
      push(`${first}.${last}`);
      push(`${first[0]}${last}`);
      push(`${first}.${last}${year}`);
      if (second) push(`${first}.${last[0]}${second}`);
    }

    return candidates;
  }

  private slugifyUsernamePart(value?: string): string {
    if (!value) return '';
    return value
      .normalize('NFD')
      .replace(/\p{M}+/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }

  private clipUsername(value: string): string | null {
    const clipped = value.slice(0, 50);
    return clipped.length >= 3 ? clipped : null;
  }

  async changePassword(idUsuario: number, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas nuevas no coinciden.');
    }

    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario },
    });

    if (usuario && dto.newPassword === usuario.username) {
      throw new BadRequestException(
        'La nueva contraseña no puede ser igual a tu usuario (CI).',
      );
    }

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, usuario.password);
    if (!isValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta.');
    }

    usuario.password = await bcrypt.hash(dto.newPassword, 10);
    await this.usuarioRepository.save(usuario);

    return { message: 'Contraseña actualizada correctamente.' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const username = dto.username?.trim();
    if (!username) {
      return { message: GENERIC_FORGOT_MESSAGE };
    }

    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { username },
        relations: ['persona'],
      });

      const email = usuario?.persona?.email?.trim();
      if (usuario && !usuario.deletedAt && email) {
        await this.passwordResetTokenRepository.update(
          { usuario: { idUsuario: usuario.idUsuario }, usedAt: IsNull() },
          { usedAt: new Date() },
        );

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashResetToken(rawToken);
        const ttlMinutes = Number(
          this.configService.get<string>('PASSWORD_RESET_TTL_MINUTES') ?? 60,
        );
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

        const record = this.passwordResetTokenRepository.create({
          usuario: { idUsuario: usuario.idUsuario },
          tokenHash,
          expiresAt,
          usedAt: null,
        });
        await this.passwordResetTokenRepository.save(record);

        const frontendUrl = (
          this.configService.get<string>('FRONTEND_URL') ||
          'http://localhost:5173'
        ).replace(/\/$/, '');
        const resetUrl = `${frontendUrl}/restablecer-contrasena?token=${rawToken}`;

        await this.mailService.sendPasswordReset(email, resetUrl);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`forgotPassword falló: ${message}`);
    }

    return { message: GENERIC_FORGOT_MESSAGE };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas nuevas no coinciden.');
    }

    const tokenHash = this.hashResetToken(dto.token.trim());
    const record = await this.passwordResetTokenRepository.findOne({
      where: {
        tokenHash,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: ['usuario'],
    });

    if (!record?.usuario) {
      throw new BadRequestException(
        'El enlace de recuperación no es válido o ha expirado.',
      );
    }

    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario: record.usuario.idUsuario },
    });
    if (!usuario || usuario.deletedAt) {
      throw new BadRequestException(
        'El enlace de recuperación no es válido o ha expirado.',
      );
    }

    if (dto.newPassword === usuario.username) {
      throw new BadRequestException(
        'La nueva contraseña no puede ser igual a tu usuario (CI).',
      );
    }

    usuario.password = await bcrypt.hash(dto.newPassword, 10);
    await this.usuarioRepository.save(usuario);

    record.usedAt = new Date();
    await this.passwordResetTokenRepository.save(record);

    await this.passwordResetTokenRepository.update(
      { usuario: { idUsuario: usuario.idUsuario }, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    return { message: 'Contraseña restablecida correctamente.' };
  }

  private hashResetToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  async updateProfilePhoto(idPersona: number, file: UploadedFile) {
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

    const persona = await this.personaRepository.findOne({
      where: { idPersona },
    });
    if (!persona) {
      throw new NotFoundException('Persona no encontrada.');
    }

    const ext = this.resolveImageExtension(file.mimetype, file.originalname);
    const fotoUrl = this.saveImage(file, idPersona, ext);

    persona.foto = fotoUrl;
    await this.personaRepository.save(persona);

    return {
      message: 'Foto de perfil actualizada correctamente.',
      foto: fotoUrl,
    };
  }

  async updateEstudianteDocumentos(
    idPersona: number,
    pdfMatricula?: UploadedFile,
    pdfCarnet?: UploadedFile,
  ) {
    if (!pdfMatricula && !pdfCarnet) {
      throw new BadRequestException(
        'Debes adjuntar al menos un documento PDF.',
      );
    }

    const estudiante = await this.estudianteRepository.findOne({
      where: { persona: { idPersona } },
      relations: ['persona'],
    });

    if (!estudiante) {
      throw new NotFoundException(
        'No se encontró un registro de estudiante para tu cuenta.',
      );
    }

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
    }

    estudiante.fechaSincronizacion = new Date();
    await this.estudianteRepository.save(estudiante);

    return {
      message: 'Documentos actualizados correctamente.',
      estudiante: {
        idEstudiante: estudiante.idEstudiante,
        documentoMatriculaUrl: estudiante.documentoMatriculaUrl,
        documentoCarnetUrl: estudiante.documentoCarnetUrl,
        fechaSincronizacion: estudiante.fechaSincronizacion,
      },
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

  private saveImage(file: UploadedFile, idPersona: number, ext: string) {
    const uploadDir = this.ensureDir('perfiles');
    const safeName = `foto_${idPersona}_${Date.now()}${ext}`;
    const fullPath = path.join(uploadDir, safeName);
    fs.writeFileSync(fullPath, file.buffer);
    return `/uploads/perfiles/${safeName}`;
  }

  private savePdf(file: UploadedFile, prefix: string) {
    const uploadDir = this.ensureDir('registros');
    const safeName = `${prefix}_${Date.now()}_${Math.round(
      Math.random() * 1e9,
    )}.pdf`;
    const fullPath = path.join(uploadDir, safeName);
    fs.writeFileSync(fullPath, file.buffer);
    return `/uploads/registros/${safeName}`;
  }
}
