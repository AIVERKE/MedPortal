import { MigrationInterface, QueryRunner } from 'typeorm';

export class FormularioInstanciaVersionesYEdicion1780300000000
  implements MigrationInterface
{
  name = 'FormularioInstanciaVersionesYEdicion1780300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasInstancias = await queryRunner.hasTable('formulario_instancias');
    if (hasInstancias) {
      const table = await queryRunner.getTable('formulario_instancias');
      if (!table?.findColumnByName('borrador_edicion_respuestas')) {
        await queryRunner.query(`
          ALTER TABLE "formulario_instancias"
          ADD COLUMN "borrador_edicion_respuestas" jsonb
        `);
      }
      if (!table?.findColumnByName('borrador_edicion_definicion')) {
        await queryRunner.query(`
          ALTER TABLE "formulario_instancias"
          ADD COLUMN "borrador_edicion_definicion" jsonb
        `);
      }
      if (!table?.findColumnByName('borrador_edicion_por_id_usuario')) {
        await queryRunner.query(`
          ALTER TABLE "formulario_instancias"
          ADD COLUMN "borrador_edicion_por_id_usuario" integer
        `);
        await queryRunner.query(`
          ALTER TABLE "formulario_instancias"
          ADD CONSTRAINT "FK_formulario_instancias_borrador_edicion_por"
          FOREIGN KEY ("borrador_edicion_por_id_usuario") REFERENCES "usuarios"("id_usuario")
          ON DELETE SET NULL ON UPDATE NO ACTION
        `);
      }
      if (!table?.findColumnByName('borrador_edicion_en')) {
        await queryRunner.query(`
          ALTER TABLE "formulario_instancias"
          ADD COLUMN "borrador_edicion_en" TIMESTAMPTZ
        `);
      }
    }

    const hasVersiones = await queryRunner.hasTable(
      'formulario_instancia_versiones',
    );
    if (!hasVersiones) {
      await queryRunner.query(`
        CREATE TABLE "formulario_instancia_versiones" (
          "id_version" SERIAL NOT NULL,
          "id_instancia" integer NOT NULL,
          "editado_por_id_usuario" integer NOT NULL,
          "respuestas" jsonb NOT NULL DEFAULT '{}'::jsonb,
          "definicion_snapshot" jsonb NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_formulario_instancia_versiones" PRIMARY KEY ("id_version")
        )
      `);
      await queryRunner.query(`
        ALTER TABLE "formulario_instancia_versiones"
        ADD CONSTRAINT "FK_formulario_instancia_versiones_instancia"
        FOREIGN KEY ("id_instancia") REFERENCES "formulario_instancias"("id_instancia")
        ON DELETE CASCADE ON UPDATE NO ACTION
      `);
      await queryRunner.query(`
        ALTER TABLE "formulario_instancia_versiones"
        ADD CONSTRAINT "FK_formulario_instancia_versiones_editor"
        FOREIGN KEY ("editado_por_id_usuario") REFERENCES "usuarios"("id_usuario")
        ON DELETE RESTRICT ON UPDATE NO ACTION
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_formulario_instancia_versiones_instancia"
        ON "formulario_instancia_versiones" ("id_instancia")
      `);
    }

    // Backfill: primera versión = estado actual de instancias enviadas
    await queryRunner.query(`
      INSERT INTO "formulario_instancia_versiones"
        ("id_instancia", "editado_por_id_usuario", "respuestas", "definicion_snapshot", "created_at")
      SELECT
        i."id_instancia",
        i."quien_lleno_id_usuario",
        COALESCE(i."respuestas", '{}'::jsonb),
        i."definicion_snapshot",
        COALESCE(i."created_at", now())
      FROM "formulario_instancias" i
      WHERE i."estado" = 'enviado'
        AND NOT EXISTS (
          SELECT 1 FROM "formulario_instancia_versiones" v
          WHERE v."id_instancia" = i."id_instancia"
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasVersiones = await queryRunner.hasTable(
      'formulario_instancia_versiones',
    );
    if (hasVersiones) {
      await queryRunner.query(
        `ALTER TABLE "formulario_instancia_versiones" DROP CONSTRAINT "FK_formulario_instancia_versiones_editor"`,
      );
      await queryRunner.query(
        `ALTER TABLE "formulario_instancia_versiones" DROP CONSTRAINT "FK_formulario_instancia_versiones_instancia"`,
      );
      await queryRunner.query(`DROP TABLE "formulario_instancia_versiones"`);
    }

    const hasInstancias = await queryRunner.hasTable('formulario_instancias');
    if (hasInstancias) {
      const table = await queryRunner.getTable('formulario_instancias');
      if (table?.findColumnByName('borrador_edicion_por_id_usuario')) {
        await queryRunner.query(
          `ALTER TABLE "formulario_instancias" DROP CONSTRAINT "FK_formulario_instancias_borrador_edicion_por"`,
        );
        await queryRunner.query(
          `ALTER TABLE "formulario_instancias" DROP COLUMN "borrador_edicion_por_id_usuario"`,
        );
      }
      if (table?.findColumnByName('borrador_edicion_en')) {
        await queryRunner.query(
          `ALTER TABLE "formulario_instancias" DROP COLUMN "borrador_edicion_en"`,
        );
      }
      if (table?.findColumnByName('borrador_edicion_definicion')) {
        await queryRunner.query(
          `ALTER TABLE "formulario_instancias" DROP COLUMN "borrador_edicion_definicion"`,
        );
      }
      if (table?.findColumnByName('borrador_edicion_respuestas')) {
        await queryRunner.query(
          `ALTER TABLE "formulario_instancias" DROP COLUMN "borrador_edicion_respuestas"`,
        );
      }
    }
  }
}
