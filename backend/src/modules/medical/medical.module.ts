import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './entities/doctor.entity';
import { EspecialidadMedica } from './entities/especialidad-medica.entity';
import { PostaMedica } from './entities/posta-medica.entity';
import { ConsultorioEspecialidad } from './entities/consultorio-especialidad.entity';
import { AsignacionDoctorConsultorio } from './entities/asignacion-doctor-consultorio.entity';
import { FechaCierre } from './entities/fecha-cierre.entity';
import { Derivacion } from './entities/derivacion.entity';
import { Emergencia } from './entities/emergencia.entity';
import { ReservaPaciente } from '../appointments/entities/reserva-paciente.entity';
import { DerivacionesService } from './derivaciones.service';
import { DerivacionesController } from './derivaciones.controller';
import { UsersModule } from '../users/users.module';
import { AsignacionDoctorConsultorioService } from './asignacion-doctor-consultorio.service';
import { AsignacionDoctorConsultorioController } from './asignacion-doctor-consultorio.controller';
import { EmergenciasService } from './emergencias.service';
import { EmergenciasController } from './emergencias.controller';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([
      Doctor,
      EspecialidadMedica,
      PostaMedica,
      ConsultorioEspecialidad,
      AsignacionDoctorConsultorio,
      FechaCierre,
      Derivacion,
      Emergencia,
      ReservaPaciente,
    ]),
  ],
  controllers: [
    DerivacionesController,
    AsignacionDoctorConsultorioController,
    EmergenciasController,
  ],
  providers: [
    DerivacionesService,
    AsignacionDoctorConsultorioService,
    EmergenciasService,
  ],
  exports: [
    TypeOrmModule,
    DerivacionesService,
    AsignacionDoctorConsultorioService,
    EmergenciasService,
  ],
})
export class MedicalModule {}
