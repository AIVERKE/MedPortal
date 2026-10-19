import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReservaPaciente } from './modules/appointments/entities/reserva-paciente.entity';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './database/database.module';
import { MedicalModule } from './modules/medical/medical.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ConfiguracionReservasConsultasController } from './configuracion_reservas_consultas/configuracion_reservas_consultas.controller';
import { ConfiguracionReservasConsultasService } from './configuracion_reservas_consultas/configuracion_reservas_consultas.service';
import { FechaCierreController } from './fecha_cierre/fecha_cierre.controller';
import { FechaCierreService } from './fecha_cierre/fecha_cierre.service';
import { EspecialidadMedicaController } from './especialidad-medica/especialidad-medica.controller';
import { EspecialidadMedicaService } from './especialidad-medica/especialidad-medica.service';
import { PostasMedicasController } from './postas-medicas/postas-medicas.controller';
import { PostasMedicasService } from './postas-medicas/postas-medicas.service';
import { ConsultorioEspecialidadController } from './consultorio-especialidad/consultorio-especialidad.controller';
import { ConsultorioEspecialidadService } from './consultorio-especialidad/consultorio-especialidad.service';
import { config } from 'process';

import { ReservasPacientesController } from './reservas-pacientes/reservas-pacientes.controller';
import { ReservasPacientesService } from './reservas-pacientes/reservas-pacientes.service';
import { ReservasSchedulerService } from './reservas-pacientes/reservas-scheduler.service';
import { ContratoController } from './contrato/contrato.controller';
import { ContratoService } from './contrato/contrato.service';
import { DoctoresController } from './doctores/doctores.controller';
import { DoctoresService } from './doctores/doctores.service';
import { PersonasController } from './personas/personas.controller';
import { PersonasService } from './personas/personas.service';
import { ConsejoDiarioModule } from './modules/consejo-diario/consejo-diario.module';
import { AdministrativosModule } from './administrativos/administrativos.module';
import { ClinicalHistoryModule } from './modules/clinical-history/clinical-history.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { EstudiantesModule } from './estudiantes/estudiantes.module';
import { ConsultoresModule } from './consultores/consultores.module';
import { DocentesModule } from './docentes/docentes.module';
import { FacultadesModule } from './facultades/facultades.module';
import { CarrerasModule } from './carreras/carreras.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MailModule } from './modules/mail/mail.module';
import { BloqueosHorarioModule } from './bloqueos-horario/bloqueos-horario.module';
import { FormulariosModule } from './formularios/formularios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    MailModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE'), // ¡Solo para desarrollo!
      }),
    }),
    TypeOrmModule.forFeature([ReservaPaciente]),
    UsersModule,
    AuthModule,
    DatabaseModule,
    MedicalModule,
    AppointmentsModule,
    ConsejoDiarioModule,
    AdministrativosModule,
    ClinicalHistoryModule,
    UsuariosModule,
    EstudiantesModule,
    ConsultoresModule,
    DocentesModule,
    FacultadesModule,
    CarrerasModule,
    NotificationsModule,
    BloqueosHorarioModule,
    FormulariosModule,
  ],
  controllers: [
    AppController,
    ConfiguracionReservasConsultasController,
    FechaCierreController,
    EspecialidadMedicaController,
    PostasMedicasController,
    ConsultorioEspecialidadController,
    ReservasPacientesController,
    ContratoController,
    DoctoresController,
    PersonasController,
  ],
  providers: [
    AppService,
    ConfiguracionReservasConsultasService,
    FechaCierreService,
    EspecialidadMedicaService,
    PostasMedicasService,
    ConsultorioEspecialidadService,
    ReservasPacientesService,
    ReservasSchedulerService,
    ContratoService,
    DoctoresService,
    PersonasService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
