import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsersService {
  async update(idUsuario: number, data: { is_book: boolean }) {
    return await this.usersRepository.update(idUsuario, data);
  }

  constructor(
    @InjectRepository(Usuario)
    private usersRepository: Repository<Usuario>,
  ) { }

  async findOne(usernameOrCi: string): Promise<Usuario | null> {
    const login = usernameOrCi?.trim();
    if (!login) return null;

    return this.usersRepository.findOne({
      where: [{ username: login }, { persona: { ci: login } }],
      relations: ['persona'],
    });
  }

  async findOneById(id: number): Promise<Usuario | null> {
    return this.usersRepository.findOne({
      where: { idUsuario: id },
      relations: [
        'persona',
        'persona.doctor',
        'persona.doctor.especialidad',
        'persona.asignacionesRoles',
        'persona.asignacionesRoles.rol',
        'persona.estudiante',
        'persona.docente',
        'persona.administrativo',
        'persona.consultor',
      ],
    });
  }
}
