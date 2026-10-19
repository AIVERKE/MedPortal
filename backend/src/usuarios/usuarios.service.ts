import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../modules/users/entities/usuario.entity';
import { Persona } from '../modules/users/entities/persona.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { MailService } from '../modules/mail/mail.service';

@Injectable()
export class UsuariosService {
    private readonly logger = new Logger(UsuariosService.name);

    constructor(
        @InjectRepository(Usuario)
        private readonly usuarioRepository: Repository<Usuario>,
        @InjectRepository(Persona)
        private readonly personaRepository: Repository<Persona>,
        private readonly mailService: MailService,
    ) { }

    async create(createUsuarioDto: CreateUsuarioDto) {
        const { idPersona, password, ...rest } = createUsuarioDto;

        // Verificar si la persona existe
        const persona = await this.personaRepository.findOne({ where: { idPersona } });
        if (!persona) {
            throw new NotFoundException(`Persona con ID ${idPersona} no encontrada.`);
        }

        // Verificar si ya tiene un usuario (OneToOne)
        const existingUser = await this.usuarioRepository.findOne({
            where: { persona: { idPersona } },
            withDeleted: true,
        });

        if (existingUser) {
            // Actualizar contraseña y otros campos incluso si ya existe
            const hashedPassword = await bcrypt.hash(password, 10);
            existingUser.password = hashedPassword;
            existingUser.deletedAt = null as any;
            this.usuarioRepository.merge(existingUser, rest);
            const saved = await this.usuarioRepository.save(existingUser);
            await this.notifyPasswordResetToCi(persona, saved.username || password, true);
            return saved;
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = this.usuarioRepository.create({
            ...rest,
            password: hashedPassword,
            persona,
        });

        const saved = await this.usuarioRepository.save(newUser);
        await this.notifyPasswordResetToCi(
            persona,
            saved.username || rest.username || password,
            false,
        );
        return saved;
    }

    private async notifyPasswordResetToCi(
        persona: Persona,
        username: string,
        wasReset: boolean,
    ): Promise<void> {
        const email = persona.email?.trim();
        if (!email) {
            this.logger.warn(
                `Sin correo para persona ${persona.idPersona}; no se envió aviso de contraseña.`,
            );
            return;
        }

        const nombre = [persona.nombres, persona.primerApellido, persona.segundoApellido]
            .filter(Boolean)
            .join(' ')
            .trim();

        try {
            await this.mailService.sendPasswordResetToCi(email, {
                nombre,
                username: String(username),
                wasReset,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`No se pudo enviar correo de contraseña a ${email}: ${message}`);
        }
    }

    async findAll() {
        return await this.usuarioRepository.find({
            relations: ['persona'],
        });
    }

    async findOne(id: number) {
        const usuario = await this.usuarioRepository.findOne({
            where: { idUsuario: id },
            relations: ['persona'],
        });
        if (!usuario) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
        }
        return usuario;
    }

    async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
        const usuario = await this.findOne(id);
        const { password, ...rest } = updateUsuarioDto;

        if (password) {
            usuario.password = await bcrypt.hash(password, 10);
        }

        this.usuarioRepository.merge(usuario, rest);
        return await this.usuarioRepository.save(usuario);
    }

    async remove(id: number) {
        const usuario = await this.findOne(id);
        return await this.usuarioRepository.softRemove(usuario);
    }

    async findOneByPersona(idPersona: number) {
        return await this.usuarioRepository.findOne({
            where: { persona: { idPersona } },
            withDeleted: true,
        });
    }
}
