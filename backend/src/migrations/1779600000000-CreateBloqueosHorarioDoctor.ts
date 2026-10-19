import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBloqueosHorarioDoctor1779600000000
  implements MigrationInterface
{
  name = 'CreateBloqueosHorarioDoctor1779600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasConfigCol = await queryRunner.hasColumn(
      'configuracion_reservas_consultas',
      'horas_libres_mensuales',
    );
    if (!hasConfigCol) {
      await queryRunner.query(`
        ALTER TABLE "configuracion_reservas_consultas"
        ADD "horas_libres_mensuales" integer
      `);
    }

    const hasAsigCol = await queryRunner.hasColumn(
      'asignacion_doctores_consultorio',
      'horas_libres_mensuales',
    );
    if (!hasAsigCol) {
      await queryRunner.query(`
        ALTER TABLE "asignacion_doctores_consultorio"
        ADD "horas_libres_mensuales" integer
      `);
    }

    const hasTable = await queryRunner.hasTable('bloqueos_horario_doctor');
    if (hasTable) return;

    await queryRunner.query(`
      CREATE TABLE "bloqueos_horario_doctor" (
        "id_bloqueo_horario" SERIAL NOT NULL,
        "fecha" date NOT NULL,
        "hora_inicio" TIME NOT NULL,
        "hora_fin" TIME NOT NULL,
        "id_doctor" integer NOT NULL,
        "id_asignacion" integer NOT NULL,
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_bloqueos_horario_doctor" PRIMARY KEY ("id_bloqueo_horario"),
        CONSTRAINT "UQ_bloqueo_doctor_fecha_hora" UNIQUE ("id_doctor", "fecha", "hora_inicio")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "bloqueos_horario_doctor"
      ADD CONSTRAINT "FK_bloqueo_horario_doctor"
      FOREIGN KEY ("id_doctor") REFERENCES "doctores"("id_doctor")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "bloqueos_horario_doctor"
      ADD CONSTRAINT "FK_bloqueo_horario_asignacion"
      FOREIGN KEY ("id_asignacion") REFERENCES "asignacion_doctores_consultorio"("id_asignacion_doctores_consultorio")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('bloqueos_horario_doctor');
    if (hasTable) {
      await queryRunner.query(
        `ALTER TABLE "bloqueos_horario_doctor" DROP CONSTRAINT "FK_bloqueo_horario_asignacion"`,
      );
      await queryRunner.query(
        `ALTER TABLE "bloqueos_horario_doctor" DROP CONSTRAINT "FK_bloqueo_horario_doctor"`,
      );
      await queryRunner.query(`DROP TABLE "bloqueos_horario_doctor"`);
    }

    const hasAsigCol = await queryRunner.hasColumn(
      'asignacion_doctores_consultorio',
      'horas_libres_mensuales',
    );
    if (hasAsigCol) {
      await queryRunner.query(`
        ALTER TABLE "asignacion_doctores_consultorio"
        DROP COLUMN "horas_libres_mensuales"
      `);
    }

    const hasConfigCol = await queryRunner.hasColumn(
      'configuracion_reservas_consultas',
      'horas_libres_mensuales',
    );
    if (hasConfigCol) {
      await queryRunner.query(`
        ALTER TABLE "configuracion_reservas_consultas"
        DROP COLUMN "horas_libres_mensuales"
      `);
    }
  }
}
