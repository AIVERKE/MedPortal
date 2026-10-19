import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReservasPacientesService } from './reservas-pacientes.service';

/**
 * Job periódico: marca como ATRASO las citas PENDIENTE cuya hora fin ya pasó.
 * Corre en el proceso del API (no hace falta un worker externo).
 */
@Injectable()
export class ReservasSchedulerService {
  private readonly logger = new Logger(ReservasSchedulerService.name);
  private running = false;

  constructor(private readonly reservasService: ReservasPacientesService) {}

  /** Cada minuto, al segundo 0. */
  @Cron('0 * * * * *', { timeZone: 'America/La_Paz' })
  async processOverduePendientes(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const updated = await this.reservasService.markOverduePendientesAsAtraso();
      if (updated > 0) {
        this.logger.log(
          `Marcadas ${updated} reserva(s) PENDIENTE → ATRASO por hora fin vencida`,
        );
      }
    } catch (err) {
      this.logger.error(
        'Error al marcar reservas en atraso',
        err instanceof Error ? err.stack : String(err),
      );
    } finally {
      this.running = false;
    }
  }
}
