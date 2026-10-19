import { NotificationType } from '../enums/notification-type.enum';

export class CreateNotificacionDto {
  idUsuario: number;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  idReservaPaciente?: number;
  metadata?: Record<string, unknown>;
  claveDedup: string;
}
