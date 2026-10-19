import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { DerivacionesService } from './derivaciones.service';
import { CreateDerivacionDto } from './dto/create-derivacion.dto';
import { UpdateDerivacionDto } from './dto/update-derivacion.dto';
import { Derivacion } from './entities/derivacion.entity';

@ApiTags('Derivaciones')
@Controller('medical/derivaciones')
export class DerivacionesController {
  constructor(private readonly derivacionesService: DerivacionesService) { }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva derivación' })
  @ApiResponse({
    status: 201,
    description: 'La derivación ha sido creada exitosamente.',
    type: Derivacion,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({
    status: 404,
    description: 'Usuario, Especialidad o Doctor no encontrado.',
  })
  async create(
    @Body() createDerivacionDto: CreateDerivacionDto,
  ): Promise<Derivacion> {
    return this.derivacionesService.create(createDerivacionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las derivaciones' })
  @ApiResponse({
    status: 200,
    description: 'Lista de derivaciones.',
    type: [Derivacion],
  })
  async findAll(): Promise<Derivacion[]> {
    return this.derivacionesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una derivación por su ID' })
  @ApiParam({ name: 'id', description: 'ID de la derivación' })
  @ApiResponse({
    status: 200,
    description: 'La derivación solicitada.',
    type: Derivacion,
  })
  @ApiResponse({ status: 404, description: 'Derivación no encontrada.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Derivacion> {
    return this.derivacionesService.findOne(id);
  }

  @Get('doctor/:idPersona')
  @ApiOperation({ summary: 'Obtener derivaciones realizadas por una persona (Doctor)' })
  @ApiParam({ name: 'idPersona', description: 'ID de la persona' })
  @ApiResponse({
    status: 200,
    description: 'Lista de derivaciones del doctor.',
    type: [Derivacion],
  })
  @ApiResponse({ status: 404, description: 'Doctor no encontrado.' })
  async findByPersona(
    @Param('idPersona', ParseIntPipe) idPersona: number,
  ): Promise<Derivacion[]> {
    return this.derivacionesService.findByPersona(idPersona);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una derivación existente' })
  @ApiParam({ name: 'id', description: 'ID de la derivación' })
  @ApiResponse({
    status: 200,
    description: 'La derivación ha sido actualizada exitosamente.',
    type: Derivacion,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({
    status: 404,
    description: 'Derivación o entidades relacionadas no encontradas.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDerivacionDto: UpdateDerivacionDto,
  ): Promise<Derivacion> {
    return this.derivacionesService.update(id, updateDerivacionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una derivación (Soft Delete)' })
  @ApiParam({ name: 'id', description: 'ID de la derivación' })
  @ApiResponse({
    status: 204,
    description: 'La derivación ha sido eliminada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Derivación no encontrada.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.derivacionesService.remove(id);
  }

  @ApiOperation({
    summary:
      'Verificar si una historia clínica tiene una derivación para una especialidad',
  })
  @ApiResponse({
    status: 200,
    description: 'Booleano que indica si existe la derivación.',
    type: Boolean,
  })
  @Get('check/:idHcl/:idEspecialidad')
  async checkDerivacion(
    @Param('idHcl', ParseIntPipe) idHcl: number,
    @Param('idEspecialidad', ParseIntPipe) idEspecialidad: number,
  ): Promise<boolean> {
    return this.derivacionesService.hasDerivacion(idHcl, idEspecialidad);
  }
}
