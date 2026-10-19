import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { Usuario } from './entities/usuario.entity';
import { Persona } from './entities/persona.entity';
import { Estudiante } from './entities/estudiante.entity';
import { Docente } from './entities/docente.entity';
import { Administrativo } from './entities/administrativo.entity';
import { Consultor } from './entities/consultor.entity';
import { Rol } from './entities/rol.entity';
import { AsignacionRol } from './entities/asignacion-rol.entity';
import { HistorialUsuario } from './entities/historial-usuario.entity';
import { ContratoConsultor } from './entities/contrato-consultor.entity';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { AsignacionRolesService } from './asignacion-roles.service';
import { AsignacionRolesController } from './asignacion-roles.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      Persona,
      Estudiante,
      Docente,
      Administrativo,
      Consultor,
      Rol,
      AsignacionRol,
      HistorialUsuario,
      ContratoConsultor,
    ]),
  ],
  controllers: [RolesController, AsignacionRolesController],
  providers: [UsersService, RolesService, AsignacionRolesService],
  exports: [UsersService, RolesService, AsignacionRolesService, TypeOrmModule],
})
export class UsersModule { }
