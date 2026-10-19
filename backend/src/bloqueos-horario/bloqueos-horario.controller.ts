import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BloqueosHorarioService } from './bloqueos-horario.service';
import { CreateBloqueoHorarioDto } from './dto/create-bloqueo-horario.dto';

@ApiTags('Bloqueos Horario')
@ApiBearerAuth()
@Controller('bloqueos-horario')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BloqueosHorarioController {
  constructor(private readonly bloqueosService: BloqueosHorarioService) {}

  @Get('mios')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Listar bloqueos del doctor autenticado' })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  findMios(
    @Req() req: any,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.bloqueosService.findMios(req.user.idPersona, desde, hasta);
  }

  @Get('mios/cupo')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Cupo mensual de horas libres del doctor autenticado' })
  @ApiQuery({ name: 'anio', required: false })
  @ApiQuery({ name: 'mes', required: false })
  getCupoMios(
    @Req() req: any,
    @Query('anio') anioRaw?: string,
    @Query('mes') mesRaw?: string,
  ) {
    const now = new Date();
    const anio = anioRaw ? Number(anioRaw) : now.getFullYear();
    const mes = mesRaw ? Number(mesRaw) : now.getMonth() + 1;
    if (!Number.isFinite(anio) || !Number.isFinite(mes) || mes < 1 || mes > 12) {
      throw new BadRequestException('anio/mes inválidos');
    }
    return this.bloqueosService.getCupoMios(req.user.idPersona, anio, mes);
  }

  @Get('doctor/:idDoctor')
  @ApiOperation({
    summary:
      'Listar bloqueos de un doctor en un rango (para pintar ocupación en reservas)',
  })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  findByDoctor(
    @Param('idDoctor', ParseIntPipe) idDoctor: number,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.bloqueosService.findByDoctorRange(idDoctor, desde, hasta);
  }

  @Post()
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Crear bloqueo de un slot' })
  create(@Req() req: any, @Body() dto: CreateBloqueoHorarioDto) {
    return this.bloqueosService.create(req.user.idPersona, dto);
  }

  @Delete(':id')
  @Roles('DOCTOR')
  @ApiOperation({ summary: 'Eliminar un bloqueo futuro propio' })
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.bloqueosService.remove(req.user.idPersona, id);
  }
}
