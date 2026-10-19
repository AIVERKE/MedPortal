import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('Notificaciones')
@Controller('notificaciones')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificaciones del usuario autenticado' })
  @ApiQuery({
    name: 'soloNoLeidas',
    required: false,
    type: Boolean,
    description: 'Filtrar solo notificaciones no leídas',
  })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones.' })
  findAll(
    @Req() req: { user: { idUsuario: number } },
    @Query('soloNoLeidas') soloNoLeidas?: string,
  ) {
    return this.notificationsService.findByUsuario(req.user.idUsuario, {
      soloNoLeidas: soloNoLeidas === 'true',
    });
  }

  @Get('no-leidas/count')
  @ApiOperation({ summary: 'Contador de notificaciones no leídas' })
  @ApiResponse({ status: 200, description: 'Número de notificaciones no leídas.' })
  countUnread(@Req() req: { user: { idUsuario: number } }) {
    return this.notificationsService
      .countUnread(req.user.idUsuario)
      .then((count) => ({ count }));
  }

  @Patch('marcar-todas-leidas')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  @ApiResponse({ status: 200, description: 'Notificaciones actualizadas.' })
  markAllAsRead(@Req() req: { user: { idUsuario: number } }) {
    return this.notificationsService.markAllAsRead(req.user.idUsuario);
  }

  @Patch(':id/leida')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída.' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada.' })
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { idUsuario: number } },
  ) {
    return this.notificationsService.markAsRead(id, req.user.idUsuario);
  }
}
