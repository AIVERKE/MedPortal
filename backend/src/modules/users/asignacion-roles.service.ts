import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AsignacionRol } from './entities/asignacion-rol.entity';
import { Persona } from './entities/persona.entity';
import { Rol } from './entities/rol.entity';

@Injectable()
export class AsignacionRolesService {
    constructor(
        @InjectRepository(AsignacionRol)
        private readonly asignacionRolesRepository: Repository<AsignacionRol>,
        @InjectRepository(Persona)
        private readonly personasRepository: Repository<Persona>,
        @InjectRepository(Rol)
        private readonly rolesRepository: Repository<Rol>,
    ) { }

    async assignRole(idPersona: number, idRol: number, active: boolean, requesterRole: string) {
        // Verificar que el rol existe
        const rol = await this.rolesRepository.findOne({
            where: { idRol },
        });
        if (!rol) throw new NotFoundException('Rol no encontrado');

        // Restricción de SUPERUSUARIO
        if (rol.nombre === 'SUPERUSUARIO' && requesterRole !== 'SUPERUSUARIO') {
            throw new ForbiddenException('Solo un SUPERUSUARIO puede asignar el rol de SUPERUSUARIO');
        }

        // Verificar que la persona existe
        const persona = await this.personasRepository.findOne({
            where: { idPersona },
        });
        if (!persona) throw new NotFoundException('Persona no encontrada');

        // Buscar si ya existe una asignación (asumiendo que idPersona e idRol son suficientes para identificarla)
        let asignacion = await this.asignacionRolesRepository.findOne({
            where: {
                persona: { idPersona },
                rol: { idRol },
            },
        });

        if (asignacion) {
            // Si existe, actualizar el estado
            asignacion.activo = active;
            return await this.asignacionRolesRepository.save(asignacion);
        } else {
            // Si no existe, crear una nueva
            const nuevaAsignacion = this.asignacionRolesRepository.create({
                persona,
                rol,
                activo: active,
            });
            return await this.asignacionRolesRepository.save(nuevaAsignacion);
        }
    }

    async findByPersona(idPersona: number) {
        return await this.asignacionRolesRepository.find({
            where: {
                persona: { idPersona },
            },
            relations: ['rol'],
        });
    }
}
