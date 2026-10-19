import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Carrera } from '../modules/users/entities/carrera.entity';
import { Facultad } from '../modules/users/entities/facultad.entity';
import { CarrerasController } from './carreras.controller';
import { CarrerasService } from './carreras.service';

@Module({
  imports: [TypeOrmModule.forFeature([Carrera, Facultad])],
  controllers: [CarrerasController],
  providers: [CarrerasService],
  exports: [CarrerasService, TypeOrmModule],
})
export class CarrerasModule {}
