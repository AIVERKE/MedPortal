import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notificacion } from './entities/notificacion.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsSchedulerService } from './notifications-scheduler.service';
import { NotificationsController } from './notifications.controller';
import { ReservaPaciente } from '../appointments/entities/reserva-paciente.entity';
import { UsuariosModule } from '../../usuarios/usuarios.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notificacion, ReservaPaciente]),
    UsuariosModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsSchedulerService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
