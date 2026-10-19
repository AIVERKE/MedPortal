import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from '../modules/users/entities/usuario.entity';
import { Persona } from '../modules/users/entities/persona.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Usuario, Persona])],
    controllers: [UsuariosController],
    providers: [UsuariosService],
    exports: [UsuariosService],
})
export class UsuariosModule { }
