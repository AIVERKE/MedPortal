import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AsignacionDoctorConsultorioService } from './asignacion-doctor-consultorio.service';
import { CreateAsignacionDoctorConsultorioDto } from './dto/create-asignacion-doctor-consultorio.dto';
import { PrevisualizarImpactoTurnoDto } from './dto/previsualizar-impacto-turno.dto';

@ApiTags('Asignación Doctores Consultorio')
@ApiBearerAuth()
@Controller('medical/asignacion-doctores-consultorio')
export class AsignacionDoctorConsultorioController {
  constructor(
    private readonly asignacionService: AsignacionDoctorConsultorioService,
  ) {}

  @ApiOperation({ summary: 'Crear nueva asignación de doctor a consultorio' })
  @ApiResponse({ status: 201, description: 'Asignación creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  create(@Body() createDto: CreateAsignacionDoctorConsultorioDto) {
    return this.asignacionService.create(createDto);
  }

  @ApiOperation({ summary: 'Obtener todas las asignaciones activas' })
  @ApiResponse({
    status: 200,
    description: 'Asignaciones obtenidas exitosamente.',
  })
  @Get()
  findAll() {
    return this.asignacionService.findAll();
  }

  @ApiOperation({
    summary:
      'Previsualizar citas futuras perjudicadas por un cambio de horario/días',
  })
  @ApiResponse({ status: 200, description: 'Impacto calculado.' })
  @Post(':id/previsualizar-impacto')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  previsualizarImpacto(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PrevisualizarImpactoTurnoDto,
  ) {
    return this.asignacionService.previsualizarImpacto(id, dto);
  }

  @ApiOperation({ summary: 'Obtener asignación por ID' })
  @ApiResponse({
    status: 200,
    description: 'Asignación obtenida exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada.' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.asignacionService.findOne(id);
  }

  @ApiOperation({ summary: 'Actualizar asignación existente' })
  @ApiResponse({
    status: 200,
    description: 'Asignación actualizada exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada.' })
  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Partial<CreateAsignacionDoctorConsultorioDto>,
  ) {
    return this.asignacionService.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Eliminar asignación (borrado lógico)' })
  @ApiResponse({
    status: 200,
    description: 'Asignación eliminada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada.' })
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.asignacionService.remove(id);
  }
}
