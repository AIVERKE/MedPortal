import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocentesService } from './docentes.service';
import { DocentesController } from './docentes.controller';
import { Docente } from '../modules/users/entities/docente.entity';
import { Persona } from '../modules/users/entities/persona.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Docente, Persona])],
    controllers: [DocentesController],
    providers: [DocentesService],
    exports: [DocentesService],
})
export class DocentesModule { }
