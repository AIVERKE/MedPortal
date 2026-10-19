import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Usuario } from '../modules/users/entities/usuario.entity';
import { Persona } from '../modules/users/entities/persona.entity';
import { Rol } from '../modules/users/entities/rol.entity';
import { AsignacionRol } from '../modules/users/entities/asignacion-rol.entity';
import { Facultad } from '../modules/users/entities/facultad.entity';
import { Carrera } from '../modules/users/entities/carrera.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      Persona,
      Rol,
      AsignacionRol,
      Facultad,
      Carrera,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class DatabaseModule { }
