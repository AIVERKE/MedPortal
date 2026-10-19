import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultoresService } from './consultores.service';
import { ConsultoresController } from './consultores.controller';
import { Consultor } from '../modules/users/entities/consultor.entity';
import { Persona } from '../modules/users/entities/persona.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Consultor, Persona])],
    controllers: [ConsultoresController],
    providers: [ConsultoresService],
    exports: [ConsultoresService],
})
export class ConsultoresModule { }
