import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(Rol)
        private readonly rolesRepository: Repository<Rol>,
    ) { }

    async findAll() {
        return await this.rolesRepository.find();
    }

    async findOne(id: number) {
        const rol = await this.rolesRepository.findOne({ where: { idRol: id } });
        if (!rol) throw new NotFoundException('Rol no encontrado');
        return rol;
    }

    async create(data: Partial<Rol>) {
        const rol = this.rolesRepository.create(data);
        return await this.rolesRepository.save(rol);
    }

    async update(id: number, data: Partial<Rol>) {
        await this.findOne(id);
        await this.rolesRepository.update(id, data);
        return this.findOne(id);
    }

    async remove(id: number) {
        const rol = await this.findOne(id);
        return await this.rolesRepository.softRemove(rol);
    }
}
