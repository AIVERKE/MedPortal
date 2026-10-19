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
import { CreateFechaCierre } from './dto/create_fecha_cierre/create_fecha_cierre';
import { FechaCierreService } from './fecha_cierre.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Fechas de Cierre')
@Controller('fecha-cierre-reservas')
export class FechaCierreController {
  //Declaramos el servicio en el constructor
  constructor(private readonly fechaCierreService: FechaCierreService) {}

  // Endpoint to get closing date by ID
  @ApiOperation({ summary: 'Obtener fecha de cierre por ID' })
  @ApiResponse({
    status: 200,
    description: 'Fecha de cierre obtenida exitosamente.',
    type: CreateFechaCierre,
  })
  @ApiResponse({ status: 404, description: 'Fecha de cierre no encontrada.' })
  @Get(':id')
  async getFechaCierreById(@Param('id') id: string) {
    const fechaCierre = await this.fechaCierreService.findOne(+id);
    if (!fechaCierre) {
      throw new NotFoundException(
        'Fecha de cierre con ID ' + id + ' no encontrada.',
      );
    }
    return fechaCierre;
  }

  // Endpoint to get all closing dates
  @ApiOperation({ summary: 'Obtener todas las fechas de cierre' })
  @ApiResponse({
    status: 200,
    description: 'Fechas de cierre obtenidas exitosamente.',
    type: [CreateFechaCierre],
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron fechas de cierre.',
  })
  @Get('')
  async getAllFechasCierre() {
    const allFechasCierre = await this.fechaCierreService.findAll();
    return allFechasCierre;
  }

  // Endpoint to post a new closing date
  @ApiOperation({ summary: 'Crear nueva fecha de cierre' })
  @ApiResponse({
    status: 201,
    description: 'Fecha de cierre creada exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @Post()
  async postFechaCierre(@Body() dataFechaCierre: CreateFechaCierre) {
    return await this.fechaCierreService.create(dataFechaCierre);
  }

  // Endpoint to update an existing closing date
  @ApiOperation({ summary: 'Actualizar fecha de cierre existente' })
  @ApiResponse({
    status: 200,
    description: 'Fecha de cierre actualizada exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @Put(':id')
  async updateFechaCierre(
    @Param('id') id: string,
    @Body() dataFechaCierre: Partial<CreateFechaCierre>,
  ) {
    return await this.fechaCierreService.update(+id, dataFechaCierre);
  }

  // endpoint to delete a closing date by ID
  @ApiOperation({ summary: 'Eliminar fecha de cierre por ID' })
  @ApiResponse({
    status: 200,
    description: 'Fecha de cierre eliminada exitosamente.',
  })
  @Delete(':id')
  async deleteFechaCierre(@Param('id') id: string) {
    if (await this.fechaCierreService.remove(+id)) {
      return { message: 'Fecha de cierre eliminada exitosamente.' };
    }
    throw new NotFoundException(
      'Fecha de cierre con ID ' + id + ' no encontrada.',
    );
  }
}
