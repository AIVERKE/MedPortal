import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  NotFoundException,
  Put,
  Delete,
} from '@nestjs/common';
import { CreateConsultorioEspecialidad } from './dto/create-consultorio-especialidad/create-consultorio-especialidad';
import { ConsultorioEspecialidadService } from './consultorio-especialidad.service';
import { ReservasPacientesService } from '../reservas-pacientes/reservas-pacientes.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Consultorios Especialidad')
@Controller('consultorio-especialidad')
export class ConsultorioEspecialidadController {
  //Declaramos el servicio en el constructor
  constructor(
    private readonly consultorioEspecialidadService: ConsultorioEspecialidadService,
    private readonly reservasService: ReservasPacientesService,
  ) {}

  // Endpoint to get medical specialty office by ID
  @ApiOperation({ summary: 'Obtener reservas por ID de consultorio' })
  @ApiResponse({
    status: 200,
    description: 'Reservas del consultorio obtenidas exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Consultorio no encontrado.' })
  @Get(':id/reservas')
  async getReservasByConsultorio(@Param('id') id: string) {
    const consultorio = await this.consultorioEspecialidadService.findOne(+id);
    return await this.reservasService.findByPostaAndEspecialidad(
      consultorio.posta.idPosta,
      consultorio.especialidad.idEspecialidadMedica,
    );
  }

  // Endpoint to get medical specialty office by ID
  @ApiOperation({ summary: 'Obtener consultorio especialidad por ID' })
  @ApiResponse({
    status: 200,
    description: 'Consultorio especialidad obtenido exitosamente.',
    type: CreateConsultorioEspecialidad,
  })
  @ApiResponse({
    status: 404,
    description: 'Consultorio especialidad no encontrado.',
  })
  @Get(':id')
  async getConsultorioEspecialidadById(@Param('id') id: string) {
    return await this.consultorioEspecialidadService.findOne(+id);
  }

  // Endpoint to get all medical specialty offices
  @ApiOperation({ summary: 'Obtener todos los consultorios especialidad' })
  @ApiResponse({
    status: 200,
    description: 'Consultorios especialidad obtenidos exitosamente.',
    type: [CreateConsultorioEspecialidad],
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron consultorios especialidad.',
  })
  @Get('')
  async getAllConsultoriosEspecialidad() {
    return await this.consultorioEspecialidadService.findAll();
  }

  // Endpoint to post a new medical specialty office
  @ApiOperation({ summary: 'Crear nuevo consultorio especialidad' })
  @ApiResponse({
    status: 201,
    description: 'Consultorio especialidad creado exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @Post()
  async postConsultorioEspecialidad(
    @Body() dataConsultorioEspecialidad: CreateConsultorioEspecialidad,
  ) {
    return await this.consultorioEspecialidadService.create(
      dataConsultorioEspecialidad,
    );
  }

  // Endpoint to update an existing medical specialty office
  @ApiOperation({ summary: 'Actualizar consultorio especialidad existente' })
  @ApiResponse({
    status: 200,
    description: 'Consultorio especialidad actualizado exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @Put(':id')
  async updateConsultorioEspecialidad(
    @Param('id') id: string,
    @Body() dataConsultorioEspecialidad: Partial<CreateConsultorioEspecialidad>,
  ) {
    return await this.consultorioEspecialidadService.update(
      +id,
      dataConsultorioEspecialidad,
    );
  }

  // endpoint to delete a medical specialty office by ID
  @ApiOperation({ summary: 'Eliminar consultorio especialidad por ID' })
  @ApiResponse({
    status: 200,
    description: 'Consultorio especialidad eliminado exitosamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Consultorio especialidad no encontrado.',
  })
  @Delete(':id')
  async deleteConsultorioEspecialidad(@Param('id') id: string) {
    if (await this.consultorioEspecialidadService.remove(+id)) {
      return { message: 'Consultorio especialidad eliminado exitosamente.' };
    }
    throw new NotFoundException(
      'Consultorio especialidad con ID ' + id + ' no encontrado.',
    );
  }
}
