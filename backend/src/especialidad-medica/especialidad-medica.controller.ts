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
import { CreateEspecialidadMedica } from './dto/create-especialidad-medica/create-especialidad-medica';
import { EspecialidadMedicaService } from './especialidad-medica.service';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Especialidades Médicas')
@Controller('especialidad-medica')
export class EspecialidadMedicaController {
  //Declaramos el servicio en el constructor
  constructor(
    private readonly especialidadMedicaService: EspecialidadMedicaService,
  ) {}

  // Endpoint to get medical specialty by ID
  @ApiOperation({ summary: 'Obtener especialidad médica por ID' })
  @ApiResponse({
    status: 200,
    description: 'Especialidad médica obtenida exitosamente.',
    type: CreateEspecialidadMedica,
  })
  @ApiResponse({
    status: 404,
    description: 'Especialidad médica no encontrada.',
  })
  @Get(':id')
  async getEspecialidadMedicaById(@Param('id') id: string) {
    return await this.especialidadMedicaService.findOne(+id);
  }

  // Endpoint to get all medical specialties
  @ApiOperation({ summary: 'Obtener todas las especialidades médicas' })
  @ApiResponse({
    status: 200,
    description: 'Especialidades médicas obtenidas exitosamente.',
    type: [CreateEspecialidadMedica],
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron especialidades médicas.',
  })
  @Public()
  @Get('')
  async getAllEspecialidadesMedicas() {
    const allEspecialidadesMedicas =
      await this.especialidadMedicaService.findAll();
    if (allEspecialidadesMedicas.length === 0) {
      throw new NotFoundException('No se encontraron especialidades médicas.');
    }
    return allEspecialidadesMedicas;
  }

  // Endpoint to post a new medical specialty
  @ApiOperation({ summary: 'Crear nueva especialidad médica' })
  @ApiResponse({
    status: 201,
    description: 'Especialidad médica creada exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @Post()
  async postEspecialidadMedica(
    @Body() dataEspecialidadMedica: CreateEspecialidadMedica,
  ) {
    return await this.especialidadMedicaService.create(dataEspecialidadMedica);
  }

  // Endpoint to update an existing medical specialty
  @ApiOperation({ summary: 'Actualizar especialidad médica existente' })
  @ApiResponse({
    status: 200,
    description: 'Especialidad médica actualizada exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @Put(':id')
  async updateEspecialidadMedica(
    @Param('id') id: string,
    @Body() dataEspecialidadMedica: Partial<CreateEspecialidadMedica>,
  ) {
    return await this.especialidadMedicaService.update(
      +id,
      dataEspecialidadMedica,
    );
  }

  // endpoint to delete a medical specialty by ID
  @ApiOperation({ summary: 'Eliminar especialidad médica por ID' })
  @ApiResponse({
    status: 200,
    description: 'Especialidad médica eliminada exitosamente.',
  })
  @Delete(':id')
  async deleteEspecialidadMedica(@Param('id') id: string) {
    await this.especialidadMedicaService.remove(+id);
    return { message: 'Especialidad médica eliminada exitosamente.' };
  }
}
