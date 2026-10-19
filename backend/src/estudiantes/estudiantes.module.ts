import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstudiantesService } from './estudiantes.service';
import { EstudiantesController } from './estudiantes.controller';
import { Estudiante } from '../modules/users/entities/estudiante.entity';
import { Persona } from '../modules/users/entities/persona.entity';
import { Facultad } from '../modules/users/entities/facultad.entity';
import { Carrera } from '../modules/users/entities/carrera.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Estudiante, Persona, Facultad, Carrera])],
    controllers: [EstudiantesController],
    providers: [EstudiantesService],
    exports: [EstudiantesService],
})
export class EstudiantesModule { }
