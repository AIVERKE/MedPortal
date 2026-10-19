import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificacionesTable1779100000000
  implements MigrationInterface
{
  name = 'CreateNotificacionesTable1779100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('notificaciones');
    if (hasTable) return;

    await queryRunner.query(`
      CREATE TABLE "notificaciones" (
        "id_notificacion" SERIAL NOT NULL,
        "tipo" character varying(50) NOT NULL,
        "titulo" character varying(200) NOT NULL,
        "mensaje" text NOT NULL,
        "leida" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "clave_dedup" character varying(100) NOT NULL,
        "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(),
        "fecha_leida" TIMESTAMP,
        "id_usuario" integer,
        "id_reserva_paciente" integer,
        CONSTRAINT "UQ_notificaciones_clave_dedup" UNIQUE ("clave_dedup"),
        CONSTRAINT "PK_notificaciones" PRIMARY KEY ("id_notificacion")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "notificaciones"
      ADD CONSTRAINT "FK_notificaciones_usuario"
      FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "notificaciones"
      ADD CONSTRAINT "FK_notificaciones_reserva"
      FOREIGN KEY ("id_reserva_paciente") REFERENCES "reservas_paciente"("id_reserva_paciente")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notificaciones" DROP CONSTRAINT "FK_notificaciones_reserva"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notificaciones" DROP CONSTRAINT "FK_notificaciones_usuario"`,
    );
    await queryRunner.query(`DROP TABLE "notificaciones"`);
  }
}
