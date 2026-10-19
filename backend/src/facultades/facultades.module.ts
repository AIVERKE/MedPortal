import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Facultad } from '../modules/users/entities/facultad.entity';
import { FacultadesController } from './facultades.controller';
import { FacultadesService } from './facultades.service';

@Module({
  imports: [TypeOrmModule.forFeature([Facultad])],
  controllers: [FacultadesController],
  providers: [FacultadesService],
  exports: [FacultadesService, TypeOrmModule],
})
export class FacultadesModule {}
