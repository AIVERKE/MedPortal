import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  Req,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { ReservasPacientesService } from './reservas-pacientes.service';
import { CreateReservaPacienteDto } from './dto/create-reserva-paciente.dto';
import { AtenderReservaDto } from './dto/atender-reserva.dto';
import { CreateConsultaSinReservaDto } from './dto/create-consulta-sin-reserva.dto';
import { ReagendarReservaDto } from './dto/reagendar-reserva.dto';
import { CancelarReservaDto } from './dto/cancelar-reserva.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Reservas Pacientes')
@ApiBearerAuth()
@Controller('reservas-pacientes')
export class ReservasPacientesController {
  constructor(private readonly reservasService: ReservasPacientesService) { }

  @ApiOperation({ summary: 'Crear nueva reserva' })
  @ApiResponse({ status: 201, description: 'Reserva creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @ApiResponse({
    status: 409,
    description:
      'Conflicto: El usuario o el doctor ya tienen una reserva en ese horario.',
  })
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  create(@Body() createReservaDto: CreateReservaPacienteDto, @Req() req: any) {
    // DOCTOR / SUPERUSUARIO pueden agendar para un paciente (idUsuario del body).
    // El resto de roles solo pueden reservar para sí mismos.
    const rol = String(req.user?.rol || '').toUpperCase();
    const puedeAgendarParaOtro =
      rol === 'DOCTOR' || rol === 'SUPERUSUARIO';

    if (puedeAgendarParaOtro) {
      if (!createReservaDto?.idUsuario) {
        throw new BadRequestException(
          'Debe indicar el paciente (idUsuario) para el cual se agenda la cita.',
        );
      }
      return this.reservasService.create(
        createReservaDto,
        Number(createReservaDto.idUsuario),
        { omitirPoliticaReservas: true },
      );
    }

    // Paciente u otros roles: siempre la reserva es para el usuario autenticado.
    return this.reservasService.create(createReservaDto, req.user.idUsuario);
  }

  @ApiOperation({
    summary: 'Registrar consulta espontánea (sin reserva previa)',
    description:
      'Registra una atención médica espontánea (walk-in). El estado se asigna automáticamente como A-SIN-RESERVA y no se requieren horarios de cita.',
  })
  @ApiResponse({
    status: 201,
    description: 'Consulta sin reserva registrada exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @Post('sin-reserva')
  createConsultaSinReserva(
    @Body() createSinReservaDto: CreateConsultaSinReservaDto,
  ) {
    return this.reservasService.createConsultaSinReserva(createSinReservaDto);
  }

  @ApiOperation({ summary: 'Obtener todas las reservas' })
  @ApiResponse({
    status: 200,
    description: 'Reservas obtenidas exitosamente.',
    type: [CreateReservaPacienteDto],
  })
  @ApiResponse({ status: 404, description: 'No se encontraron reservas.' })
  @Get()
  findAll() {
    return this.reservasService.findAll();
  }

  @ApiOperation({ summary: 'Obtener reserva por ID' })
  @ApiResponse({
    status: 200,
    description: 'Reserva obtenida exitosamente.',
    type: CreateReservaPacienteDto,
  })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada.' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservasService.findOne(id);
  }

  @ApiOperation({ summary: 'Obtener reservas por ID de persona (Doctor)' })
  @ApiResponse({
    status: 200,
    description: 'Reservas obtenidas exitosamente.',
    type: [CreateReservaPacienteDto],
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron reservas para el doctor.',
  })
  @Get('doctor/:idPersona')
  findByPersonaId(@Param('idPersona', ParseIntPipe) idPersona: number) {
    return this.reservasService.findByPersonaId(idPersona);
  }

  @ApiOperation({ summary: 'Obtener reservas por ID de usuario' })
  @ApiResponse({
    status: 200,
    description: 'Reservas obtenidas exitosamente.',
    type: [CreateReservaPacienteDto],
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron reservas para el usuario.',
  })
  @Get('usuario/:idUsuario')
  findByUserId(@Param('idUsuario', ParseIntPipe) idUsuario: number) {
    return this.reservasService.findByUserId(idUsuario);
  }

  @ApiOperation({ summary: 'Obtener reservas programadas por ID de usuario' })
  @ApiResponse({
    status: 200,
    description: 'Reservas programadas obtenidas exitosamente.',
    type: [CreateReservaPacienteDto],
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron reservas programadas para el usuario.',
  })
  @Get('usuario/:idUsuario/programadas')
  findScheduledByUserId(@Param('idUsuario', ParseIntPipe) idUsuario: number) {
    return this.reservasService.findScheduledByUserId(idUsuario);
  }

  @ApiOperation({ summary: 'Obtener reservas de un usuario por fecha' })
  @ApiResponse({
    status: 200,
    description: 'Reservas obtenidas exitosamente.',
    type: [CreateReservaPacienteDto],
  })
  @ApiResponse({
    status: 404,
    description:
      'No se encontraron reservas para el usuario en la fecha indicada.',
  })
  @ApiParam({ name: 'idUsuario', description: 'ID del usuario', type: Number })
  @ApiParam({
    name: 'fecha',
    description: 'Fecha de la cita (formato YYYY-MM-DD)',
    type: String,
  })
  @Get('usuario/:idUsuario/fecha/:fecha')
  findByUserAndDate(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Param('fecha') fecha: string,
  ) {
    return this.reservasService.findByUserAndDate(idUsuario, fecha);
  }

  @ApiOperation({
    summary: 'Obtener la reserva pendiente más próxima por ID de usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Reserva más próxima obtenida exitosamente.',
    type: CreateReservaPacienteDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron reservas pendientes para el usuario.',
  })
  @Get('usuario/:idUsuario/proxima')
  findNearestPendingByUserId(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
  ) {
    return this.reservasService.findNearestPendingByUserId(idUsuario);
  }

  @ApiOperation({ summary: 'Actualizar reserva existente' })
  @ApiResponse({
    status: 200,
    description: 'Reserva actualizada exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReservaDto: Partial<CreateReservaPacienteDto>,
  ) {
    return this.reservasService.update(id, updateReservaDto);
  }

  @ApiOperation({
    summary: 'Cancelar reserva',
    description:
      'Cancela una reserva y la transfiere a la tabla de reservas canceladas, eliminándola de la tabla principal.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reserva cancelada y movida al histórico exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Solicitud incorrecta o la reserva ya fue cancelada.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la reserva que se desea cancelar',
    type: Number,
  })
  @Patch(':id/cancelar')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: CancelarReservaDto,
  ) {
    return this.reservasService.cancel(
      id,
      req.user?.idPersona,
      req.user?.rol,
      dto?.motivo,
      req.user?.idUsuario,
    );
  }

  @ApiOperation({
    summary: 'Reagendar cita (doctor)',
    description:
      'Permite al doctor reagendar una cita PENDIENTE a otro horario dentro de su agenda.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reserva reagendada exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @ApiResponse({ status: 403, description: 'Sin permiso sobre esta reserva.' })
  @ApiResponse({
    status: 409,
    description:
      'Conflicto: El paciente o el doctor ya tienen una reserva en ese horario.',
  })
  @ApiBody({ type: ReagendarReservaDto })
  @Patch(':id/reagendar')
  reagendar(
    @Param('id', ParseIntPipe) id: number,
    @Body() reagendarDto: ReagendarReservaDto,
    @Req() req: any,
  ) {
    return this.reservasService.reagendar(
      id,
      reagendarDto,
      req.user?.idPersona,
      req.user?.rol,
    );
  }

  @ApiOperation({ summary: 'Marcar reserva como presente' })
  @ApiResponse({
    status: 200,
    description: 'Reserva marcada como PRESENTE exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @ApiParam({
    name: 'id',
    description: 'ID de la reserva que se desea marcar como presente',
    type: Number,
  })
  @Patch(':id/presente')
  markAsPresent(@Param('id', ParseIntPipe) id: number) {
    return this.reservasService.markAsPresent(id);
  }

  @ApiOperation({ summary: 'Marcar reserva como abandono' })
  @ApiResponse({
    status: 200,
    description: 'Reserva marcada como ABANDONO exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @ApiParam({
    name: 'id',
    description: 'ID de la reserva que se desea marcar como abandono',
    type: Number,
  })
  @Patch(':id/abandono')
  markAsAbandoned(@Param('id', ParseIntPipe) id: number) {
    return this.reservasService.markAsAbandoned(id);
  }

  @ApiOperation({
    summary: 'Marcar reserva como atendida',
    description:
      'Registra la fecha y hora de atención. Si la hora de atención está fuera del rango programado, el estado cambia a A-FUERA-HORARIO.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reserva marcada como atendida exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @ApiBody({ type: AtenderReservaDto })
  @ApiParam({
    name: 'id',
    description: 'ID de la reserva que se desea marcar como atendida',
    type: Number,
  })
  @Patch(':id/atendido')
  markAsAttended(
    @Param('id', ParseIntPipe) id: number,
    @Body() atenderReservaDto: AtenderReservaDto,
  ) {
    return this.reservasService.markAsAttended(id, atenderReservaDto);
  }

  @ApiOperation({
    summary: 'Eliminar reserva por ID',
    description:
      'Elimina una reserva y la guarda en el historial de reservas canceladas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reserva eliminada y movida al histórico exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta.' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reservasService.remove(id);
  }
}
