import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixNotificacionesReservaFkOnDelete1779200000000
  implements MigrationInterface
{
  name = 'FixNotificacionesReservaFkOnDelete1779200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notificaciones"
      DROP CONSTRAINT IF EXISTS "FK_1b21c424a80925618bf0594a46c"
    `);
    await queryRunner.query(`
      ALTER TABLE "notificaciones"
      DROP CONSTRAINT IF EXISTS "FK_notificaciones_reserva"
    `);
    await queryRunner.query(`
      ALTER TABLE "notificaciones"
      ADD CONSTRAINT "FK_notificaciones_reserva"
      FOREIGN KEY ("id_reserva_paciente")
      REFERENCES "reservas_paciente"("id_reserva_paciente")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notificaciones"
      DROP CONSTRAINT IF EXISTS "FK_notificaciones_reserva"
    `);
    await queryRunner.query(`
      ALTER TABLE "notificaciones"
      ADD CONSTRAINT "FK_notificaciones_reserva"
      FOREIGN KEY ("id_reserva_paciente")
      REFERENCES "reservas_paciente"("id_reserva_paciente")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }
}
