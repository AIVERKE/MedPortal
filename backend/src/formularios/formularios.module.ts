import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Formulario } from '../modules/forms/entities/formulario.entity';
import { FormularioInstancia } from '../modules/forms/entities/formulario-instancia.entity';
import { FormularioInstanciaVersion } from '../modules/forms/entities/formulario-instancia-version.entity';
import { FormularioPermisoRol } from '../modules/forms/entities/formulario-permiso-rol.entity';
import { Rol } from '../modules/users/entities/rol.entity';
import { Usuario } from '../modules/users/entities/usuario.entity';
import { FormularioLlenadoController } from './formulario-llenado.controller';
import { FormulariosController } from './formularios.controller';
import { FormulariosService } from './formularios.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Formulario,
      FormularioPermisoRol,
      FormularioInstancia,
      FormularioInstanciaVersion,
      Rol,
      Usuario,
    ]),
  ],
  controllers: [FormularioLlenadoController, FormulariosController],
  providers: [FormulariosService],
  exports: [FormulariosService, TypeOrmModule],
})
export class FormulariosModule {}
