import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservaPaciente } from './entities/reserva-paciente.entity';
import { ReservaPacienteCancelada } from './entities/reserva-paciente-canceladas.entity';
import { Pago } from './entities/pago.entity';
import { ConsultaMedica } from './entities/consulta-medica.entity';
import { ConfiguracionReservaConsulta } from './entities/configuracion-reserva-consulta.entity';
import { BloqueoHorarioDoctor } from './entities/bloqueo-horario-doctor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReservaPaciente,
      ReservaPacienteCancelada,
      Pago,
      ConsultaMedica,
      ConfiguracionReservaConsulta,
      BloqueoHorarioDoctor,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class AppointmentsModule {}
