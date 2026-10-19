import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BloqueoHorarioDoctor } from '../modules/appointments/entities/bloqueo-horario-doctor.entity';
import { ReservaPaciente } from '../modules/appointments/entities/reserva-paciente.entity';
import { AsignacionDoctorConsultorio } from '../modules/medical/entities/asignacion-doctor-consultorio.entity';
import { ConfiguracionReservaConsulta } from '../modules/appointments/entities/configuracion-reserva-consulta.entity';
import { Doctor } from '../modules/medical/entities/doctor.entity';
import { BloqueosHorarioService } from './bloqueos-horario.service';
import { BloqueosHorarioController } from './bloqueos-horario.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BloqueoHorarioDoctor,
      ReservaPaciente,
      AsignacionDoctorConsultorio,
      ConfiguracionReservaConsulta,
      Doctor,
    ]),
  ],
  controllers: [BloqueosHorarioController],
  providers: [BloqueosHorarioService],
  exports: [BloqueosHorarioService],
})
export class BloqueosHorarioModule {}
