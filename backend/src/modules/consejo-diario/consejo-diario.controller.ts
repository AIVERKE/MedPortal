import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ConsejoDiarioService } from './consejo-diario.service';
import { CreateConsejoDiarioDto } from './dto/create-consejo-diario.dto';
import { UpdateConsejoDiarioDto } from './dto/update-consejo-diario.dto';

@ApiTags('Consejo Diario')
@Controller('consejo-diario')
export class ConsejoDiarioController {
  constructor(private readonly consejoDiarioService: ConsejoDiarioService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo consejo diario' })
  @ApiResponse({
    status: 201,
    description: 'El consejo ha sido creado exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  create(@Body() createConsejoDiarioDto: CreateConsejoDiarioDto) {
    return this.consejoDiarioService.create(createConsejoDiarioDto);
  }

  @Get('consejo_aleatorio')
  @ApiOperation({ summary: 'Obtener un consejo diario aleatorio' })
  @ApiResponse({
    status: 200,
    description: 'Retorna un consejo aleatorio de la base de datos.',
  })
  getRandomConsejo() {
    return this.consejoDiarioService.getRandomConsejo();
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los consejos diarios' })
  @ApiResponse({
    status: 200,
    description: 'Retorna una lista de todos los consejos.',
  })
  findAll() {
    return this.consejoDiarioService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un consejo diario por su ID' })
  @ApiParam({ name: 'id', description: 'ID del consejo diario' })
  @ApiResponse({ status: 200, description: 'Retorna el consejo solicitado.' })
  @ApiResponse({ status: 404, description: 'Consejo no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.consejoDiarioService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un consejo diario existente' })
  @ApiParam({ name: 'id', description: 'ID del consejo diario a actualizar' })
  @ApiResponse({
    status: 200,
    description: 'El consejo ha sido actualizado exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Consejo no encontrado.' })
  update(
    @Param('id') id: string,
    @Body() updateConsejoDiarioDto: UpdateConsejoDiarioDto,
  ) {
    return this.consejoDiarioService.update(+id, updateConsejoDiarioDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un consejo diario' })
  @ApiParam({ name: 'id', description: 'ID del consejo diario a eliminar' })
  @ApiResponse({
    status: 200,
    description: 'El consejo ha sido eliminado exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Consejo no encontrado.' })
  remove(@Param('id') id: string) {
    return this.consejoDiarioService.remove(+id);
  }
}
