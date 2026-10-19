import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdministrativosService } from './administrativos.service';
import { AdministrativosController } from './administrativos.controller';
import { Administrativo } from '../modules/users/entities/administrativo.entity';
import { Persona } from '../modules/users/entities/persona.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Administrativo, Persona]),
  ],
  controllers: [AdministrativosController],
  providers: [AdministrativosService],
  exports: [AdministrativosService],
})
export class AdministrativosModule {}
