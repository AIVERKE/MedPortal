import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AdministrativosService } from './administrativos.service';
import { CreateAdministrativoDto } from './dto/create-administrativo.dto';
import { UpdateAdministrativoDto } from './dto/update-administrativo.dto';

@ApiTags('Administrativos')
@Controller('administrativos')
export class AdministrativosController {
  constructor(private readonly administrativosService: AdministrativosService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un nuevo administrativo',
    description: 'Crea un nuevo registro de administrativo y su correspondiente información de persona. Valida duplicidad de CI y Correo.'
  })
  @ApiBody({ type: CreateAdministrativoDto })
  @ApiResponse({
    status: 201,
    description: 'El administrativo ha sido creado exitosamente.'
  })
  @ApiResponse({
    status: 400,
    description: 'Solicitud incorrecta - Los datos enviados son inválidos o faltan campos obligatorios.'
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto - Ya existe un registro con el mismo CI o correo electrónico.'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor - No se pudo procesar la solicitud en la base de datos.'
  })
  async create(@Body() createDto: CreateAdministrativoDto) {
    return this.administrativosService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de administrativos' })
  @ApiResponse({ status: 200, description: 'Lista obtenida correctamente.' })
  async findAll() {
    return this.administrativosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un administrativo por ID' })
  @ApiResponse({ status: 200, description: 'Registro obtenido correctamente.' })
  @ApiResponse({ status: 404, description: 'Administrativo no encontrado.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.administrativosService.findOne(id);
  }

  @Get('persona/:idPersona')
  @ApiOperation({ summary: 'Obtener un administrativo por ID de Persona' })
  @ApiResponse({ status: 200, description: 'Registro obtenido correctamente.' })
  @ApiResponse({ status: 404, description: 'Administrativo no encontrado.' })
  async findByPersona(@Param('idPersona', ParseIntPipe) idPersona: number) {
    return this.administrativosService.findByPersona(idPersona);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar datos de un administrativo' })
  @ApiBody({ type: UpdateAdministrativoDto })
  @ApiResponse({ status: 200, description: 'Registro actualizado correctamente.' })
  @ApiResponse({ status: 404, description: 'Administrativo no encontrado.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAdministrativoDto,
  ) {
    return this.administrativosService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Borrado lógico de un administrativo' })
  @ApiResponse({ status: 204, description: 'Registro eliminado correctamente (soft delete).' })
  @ApiResponse({ status: 404, description: 'Administrativo no encontrado.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.administrativosService.remove(id);
  }
}
