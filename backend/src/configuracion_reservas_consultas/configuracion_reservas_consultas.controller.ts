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
import { CreateConfiguration } from './dto/create-configuration/create-configuration';
import { ConfiguracionReservasConsultasService } from './configuracion_reservas_consultas.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Configuración de Reservas y Consultas')
@Controller('configuracion-reservas-consultas')
export class ConfiguracionReservasConsultasController {
  //Declaramos el servicio en el constructor
  constructor(
    private readonly configuracionReservasConsultasService: ConfiguracionReservasConsultasService,
  ) {}

  // Endpoint to get configuration by ID
  @ApiOperation({ summary: 'Obtener configuración por ID' })
  @ApiResponse({
    status: 200,
    description: 'Configuración obtenida exitosamente.',
    type: CreateConfiguration,
  })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada.' })
  @Get(':id')
  async getConfigurationById(@Param('id') id: string) {
    return await this.configuracionReservasConsultasService.findOne(+id);
  }

  // Endpoint to get all configurations
  @ApiOperation({ summary: 'Obtener todas las configuraciones' })
  @ApiResponse({
    status: 200,
    description: 'Configuraciones obtenidas exitosamente.',
    type: [CreateConfiguration],
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron configuraciones.',
  })
  @Get('')
  async getAllConfigurations() {
    const allConfigurations =
      await this.configuracionReservasConsultasService.findAll();
    if (allConfigurations.length === 0) {
      throw new NotFoundException('No se encontraron configuraciones.');
    }
    return allConfigurations;
  }
  // Endpoint to post a new configuration
  @ApiOperation({ summary: 'Crear nueva configuración' })
  @ApiResponse({
    status: 201,
    description: 'Configuración creada exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @Post()
  async postConfiguration(@Body() dataConfiguration: CreateConfiguration) {
    return await this.configuracionReservasConsultasService.create(
      dataConfiguration,
    );
  }

  // Endpoint to update an existing configuration
  @ApiOperation({ summary: 'Actualizar configuración existente' })
  @ApiResponse({
    status: 200,
    description: 'Configuración actualizada exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @Put(':id')
  async updateConfiguration(
    @Param('id') id: string,
    @Body() dataConfiguration: Partial<CreateConfiguration>,
  ) {
    return await this.configuracionReservasConsultasService.update(
      +id,
      dataConfiguration,
    );
  }

  // endpoint to delete a configuration by ID
  @ApiOperation({ summary: 'Eliminar configuración por ID' })
  @ApiResponse({
    status: 200,
    description: 'Configuración eliminada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada.' })
  @Delete(':id')
  async deleteConfiguration(@Param('id') id: string) {
    if (await this.configuracionReservasConsultasService.remove(+id)) {
      return { message: 'Configuración eliminada exitosamente.' };
    }
    throw new NotFoundException(
      'Configuración con ID ' + id + ' no encontrada.',
    );
  }
}
