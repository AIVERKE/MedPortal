import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Garantiza a nivel BD que no existan solapes de rango para doctor/paciente
 * en estados que ocupan agenda (PENDIENTE, PRESENTE, ATRASO).
 * Los UNIQUE por (doctor|usuario, fecha, hora_inicio) se mantienen.
 */
export class AddReservaOverlapExclusionConstraints1779900000000
  implements MigrationInterface
{
  name = 'AddReservaOverlapExclusionConstraints1779900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);

    const overlapsDoctor = await queryRunner.query(`
      SELECT a.id_reserva_paciente AS id_a, b.id_reserva_paciente AS id_b
      FROM reservas_paciente a
      JOIN reservas_paciente b
        ON a.id_doctor = b.id_doctor
       AND a.fecha_cita = b.fecha_cita
       AND a.id_reserva_paciente < b.id_reserva_paciente
       AND a.hora_inicio_cita IS NOT NULL
       AND a.hora_fin_cita IS NOT NULL
       AND b.hora_inicio_cita IS NOT NULL
       AND b.hora_fin_cita IS NOT NULL
       AND a.deleted_at IS NULL
       AND b.deleted_at IS NULL
       AND a.estado IN ('PENDIENTE', 'PRESENTE', 'ATRASO')
       AND b.estado IN ('PENDIENTE', 'PRESENTE', 'ATRASO')
       AND tsrange(
             (a.fecha_cita + a.hora_inicio_cita)::timestamp,
             (a.fecha_cita + a.hora_fin_cita)::timestamp,
             '[)'
           ) &&
           tsrange(
             (b.fecha_cita + b.hora_inicio_cita)::timestamp,
             (b.fecha_cita + b.hora_fin_cita)::timestamp,
             '[)'
           )
      LIMIT 5
    `);

    if (overlapsDoctor?.length) {
      throw new Error(
        `No se puede crear excl_doctor_reserva_solape: hay solapes existentes (ej. reservas ${overlapsDoctor
          .map((r: { id_a: number; id_b: number }) => `${r.id_a}/${r.id_b}`)
          .join(', ')}). Resuélvelos antes de migrar.`,
      );
    }

    const overlapsPaciente = await queryRunner.query(`
      SELECT a.id_reserva_paciente AS id_a, b.id_reserva_paciente AS id_b
      FROM reservas_paciente a
      JOIN reservas_paciente b
        ON a.id_usuario = b.id_usuario
       AND a.fecha_cita = b.fecha_cita
       AND a.id_reserva_paciente < b.id_reserva_paciente
       AND a.hora_inicio_cita IS NOT NULL
       AND a.hora_fin_cita IS NOT NULL
       AND b.hora_inicio_cita IS NOT NULL
       AND b.hora_fin_cita IS NOT NULL
       AND a.deleted_at IS NULL
       AND b.deleted_at IS NULL
       AND a.estado IN ('PENDIENTE', 'PRESENTE', 'ATRASO')
       AND b.estado IN ('PENDIENTE', 'PRESENTE', 'ATRASO')
       AND tsrange(
             (a.fecha_cita + a.hora_inicio_cita)::timestamp,
             (a.fecha_cita + a.hora_fin_cita)::timestamp,
             '[)'
           ) &&
           tsrange(
             (b.fecha_cita + b.hora_inicio_cita)::timestamp,
             (b.fecha_cita + b.hora_fin_cita)::timestamp,
             '[)'
           )
      LIMIT 5
    `);

    if (overlapsPaciente?.length) {
      throw new Error(
        `No se puede crear excl_paciente_reserva_solape: hay solapes existentes (ej. reservas ${overlapsPaciente
          .map((r: { id_a: number; id_b: number }) => `${r.id_a}/${r.id_b}`)
          .join(', ')}). Resuélvelos antes de migrar.`,
      );
    }

    await queryRunner.query(`
      ALTER TABLE "reservas_paciente"
      ADD CONSTRAINT "excl_doctor_reserva_solape"
      EXCLUDE USING gist (
        id_doctor WITH =,
        fecha_cita WITH =,
        tsrange(
          (fecha_cita + hora_inicio_cita)::timestamp,
          (fecha_cita + hora_fin_cita)::timestamp,
          '[)'
        ) WITH &&
      )
      WHERE (
        estado IN ('PENDIENTE', 'PRESENTE', 'ATRASO')
        AND fecha_cita IS NOT NULL
        AND hora_inicio_cita IS NOT NULL
        AND hora_fin_cita IS NOT NULL
        AND deleted_at IS NULL
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "reservas_paciente"
      ADD CONSTRAINT "excl_paciente_reserva_solape"
      EXCLUDE USING gist (
        id_usuario WITH =,
        fecha_cita WITH =,
        tsrange(
          (fecha_cita + hora_inicio_cita)::timestamp,
          (fecha_cita + hora_fin_cita)::timestamp,
          '[)'
        ) WITH &&
      )
      WHERE (
        estado IN ('PENDIENTE', 'PRESENTE', 'ATRASO')
        AND fecha_cita IS NOT NULL
        AND hora_inicio_cita IS NOT NULL
        AND hora_fin_cita IS NOT NULL
        AND deleted_at IS NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reservas_paciente"
      DROP CONSTRAINT IF EXISTS "excl_paciente_reserva_solape"
    `);
    await queryRunner.query(`
      ALTER TABLE "reservas_paciente"
      DROP CONSTRAINT IF EXISTS "excl_doctor_reserva_solape"
    `);
  }
}
