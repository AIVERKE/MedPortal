import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { DoctoresService } from './doctores.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { UpdateDoctorContactoDto } from './dto/update-doctor-contacto.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Doctores')
@ApiBearerAuth()
@Controller('doctores')
export class DoctoresController {
  constructor(private readonly doctoresService: DoctoresService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Crear nuevo doctor' })
  @ApiResponse({
    status: 201,
    description: 'Doctor creado exitosamente.',
    type: CreateDoctorDto,
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @ApiResponse({
    status: 404,
    description: 'Persona o Especialidad no encontrada.',
  })
  create(@Body() createDoctorDto: CreateDoctorDto) {
    return this.doctoresService.create(createDoctorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los doctores' })
  @ApiResponse({ status: 200, description: 'Doctores obtenidos exitosamente.' })
  findAll() {
    return this.doctoresService.findAll();
  }

  @Patch('mios/contacto')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('DOCTOR', 'SUPERUSUARIO')
  @ApiOperation({
    summary: 'Actualizar teléfono de emergencia y consentimiento de compartir',
  })
  @ApiResponse({ status: 200, description: 'Contacto actualizado.' })
  @ApiResponse({ status: 400, description: 'Validación fallida.' })
  updateContactoMios(@Req() req: any, @Body() dto: UpdateDoctorContactoDto) {
    const idPersona = req.user?.idPersona;
    if (!idPersona) {
      throw new BadRequestException('No hay persona vinculada a la cuenta.');
    }
    return this.doctoresService.updateContactoMios(idPersona, dto);
  }

  @Get('especialidad/:id')
  @ApiOperation({
    summary: 'Obtener doctores por especialidad',
    description:
      'Retorna una lista de doctores con su respectiva posta e información de consultorio para una especialidad específica.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de doctores y sus asignaciones obtenida exitosamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Especialidad no encontrada o sin doctores asignados.',
  })
  @ApiParam({ name: 'id', description: 'ID de la especialidad médica' })
  findByEspecialidad(@Param('id', ParseIntPipe) id: number) {
    return this.doctoresService.findByEspecialidad(id);
  }

  @Get('ultimo-atendido/usuario/:idUsuario/especialidad/:idEspecialidad')
  @ApiOperation({
    summary:
      'Obtener el último doctor que atendió a un usuario por especialidad',
    description:
      'Busca en el historial de reservas atendidas la atención más reciente para el usuario y especialidad proporcionados.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Información del último doctor que atendió al usuario, o data null si no hay historial.',
  })
  @ApiParam({ name: 'idUsuario', description: 'ID del usuario (paciente)' })
  @ApiParam({
    name: 'idEspecialidad',
    description: 'ID de la especialidad médica',
  })
  findLastDoctor(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Param('idEspecialidad', ParseIntPipe) idEspecialidad: number,
  ) {
    return this.doctoresService.findLastDoctorForUserBySpecialty(
      idUsuario,
      idEspecialidad,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un doctor por ID' })
  @ApiResponse({ status: 200, description: 'Doctor obtenido exitosamente.' })
  @ApiResponse({ status: 404, description: 'Doctor no encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.doctoresService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Actualizar doctor existente' })
  @ApiResponse({ status: 200, description: 'Doctor actualizado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @ApiResponse({
    status: 404,
    description: 'Doctor, Persona o Especialidad no encontrada.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ) {
    return this.doctoresService.update(id, updateDoctorDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Eliminar doctor' })
  @ApiResponse({ status: 200, description: 'Doctor eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Doctor no encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.doctoresService.remove(id);
  }
}
