import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { EmergenciasService } from './emergencias.service';
import { CreateEmergenciaDto } from './dto/create-emergencia.dto';
import { UpdateEmergenciaDto } from './dto/update-emergencia.dto';
import { Emergencia } from './entities/emergencia.entity';

@ApiTags('Emergencias')
@Controller('medical/emergencias')
export class EmergenciasController {
  constructor(private readonly emergenciasService: EmergenciasService) { }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo registro de emergencia' })
  @ApiResponse({
    status: 201,
    description: 'La emergencia ha sido creada exitosamente.',
    type: Emergencia,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 404, description: 'Doctor no encontrado.' })
  async create(
    @Body() createEmergenciaDto: CreateEmergenciaDto,
  ): Promise<Emergencia> {
    return this.emergenciasService.create(createEmergenciaDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener el listado de todas las emergencias registradas',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de emergencias.',
    type: [Emergencia],
  })
  async findAll(): Promise<Emergencia[]> {
    return this.emergenciasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de una emergencia por ID' })
  @ApiParam({ name: 'id', description: 'ID de la emergencia' })
  @ApiResponse({
    status: 200,
    description: 'La emergencia solicitada.',
    type: Emergencia,
  })
  @ApiResponse({ status: 404, description: 'Emergencia no encontrada.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Emergencia> {
    return this.emergenciasService.findOne(id);
  }

  @Get('doctor/:idPersona')
  @ApiOperation({ summary: 'Obtener emergencias filtradas por persona (Doctor)' })
  @ApiParam({ name: 'idPersona', description: 'ID de la persona' })
  @ApiResponse({
    status: 200,
    description: 'Lista de emergencias del doctor.',
    type: [Emergencia],
  })
  @ApiResponse({ status: 404, description: 'Doctor no encontrado.' })
  async findByPersona(
    @Param('idPersona', ParseIntPipe) idPersona: number,
  ): Promise<Emergencia[]> {
    return this.emergenciasService.findByPersona(idPersona);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar los datos de una emergencia' })
  @ApiParam({ name: 'id', description: 'ID de la emergencia' })
  @ApiResponse({
    status: 200,
    description: 'La emergencia ha sido actualizada exitosamente.',
    type: Emergencia,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({
    status: 404,
    description: 'Emergencia o Doctor no encontrado.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmergenciaDto: UpdateEmergenciaDto,
  ): Promise<Emergencia> {
    return this.emergenciasService.update(id, updateEmergenciaDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una emergencia (Soft Delete)' })
  @ApiParam({ name: 'id', description: 'ID de la emergencia' })
  @ApiResponse({
    status: 204,
    description: 'La emergencia ha sido eliminada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Emergencia no encontrada.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.emergenciasService.remove(id);
  }
}
