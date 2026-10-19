import { MigrationInterface, QueryRunner } from 'typeorm';

export class FormularioInstanciasAndAudit1780100000000
  implements MigrationInterface
{
  name = 'FormularioInstanciasAndAudit1780100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasFormularios = await queryRunner.hasTable('formularios');
    if (hasFormularios) {
      const table = await queryRunner.getTable('formularios');
      if (!table?.findColumnByName('visibilidad_instancias')) {
        await queryRunner.query(`
          ALTER TABLE "formularios"
          ADD COLUMN "visibilidad_instancias" character varying(20) NOT NULL DEFAULT 'publico'
        `);
      }
      if (!table?.findColumnByName('ultimo_guardado_por_id_usuario')) {
        await queryRunner.query(`
          ALTER TABLE "formularios"
          ADD COLUMN "ultimo_guardado_por_id_usuario" integer
        `);
        await queryRunner.query(`
          ALTER TABLE "formularios"
          ADD CONSTRAINT "FK_formularios_ultimo_guardado_por"
          FOREIGN KEY ("ultimo_guardado_por_id_usuario") REFERENCES "usuarios"("id_usuario")
          ON DELETE SET NULL ON UPDATE NO ACTION
        `);
      }
      if (!table?.findColumnByName('ultimo_publicado_por_id_usuario')) {
        await queryRunner.query(`
          ALTER TABLE "formularios"
          ADD COLUMN "ultimo_publicado_por_id_usuario" integer
        `);
        await queryRunner.query(`
          ALTER TABLE "formularios"
          ADD CONSTRAINT "FK_formularios_ultimo_publicado_por"
          FOREIGN KEY ("ultimo_publicado_por_id_usuario") REFERENCES "usuarios"("id_usuario")
          ON DELETE SET NULL ON UPDATE NO ACTION
        `);
      }
    }

    const hasInstancias = await queryRunner.hasTable('formulario_instancias');
    if (!hasInstancias) {
      await queryRunner.query(`
        CREATE TABLE "formulario_instancias" (
          "id_instancia" SERIAL NOT NULL,
          "id_formulario" integer NOT NULL,
          "quien_lleno_id_usuario" integer NOT NULL,
          "para_quien_id_usuario" integer NOT NULL,
          "respuestas" jsonb NOT NULL DEFAULT '{}'::jsonb,
          "definicion_snapshot" jsonb NOT NULL,
          "estado" character varying(20) NOT NULL DEFAULT 'enviado',
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMPTZ,
          CONSTRAINT "PK_formulario_instancias" PRIMARY KEY ("id_instancia")
        )
      `);

      await queryRunner.query(`
        ALTER TABLE "formulario_instancias"
        ADD CONSTRAINT "FK_formulario_instancias_formulario"
        FOREIGN KEY ("id_formulario") REFERENCES "formularios"("id_formulario")
        ON DELETE CASCADE ON UPDATE NO ACTION
      `);

      await queryRunner.query(`
        ALTER TABLE "formulario_instancias"
        ADD CONSTRAINT "FK_formulario_instancias_quien_lleno"
        FOREIGN KEY ("quien_lleno_id_usuario") REFERENCES "usuarios"("id_usuario")
        ON DELETE RESTRICT ON UPDATE NO ACTION
      `);

      await queryRunner.query(`
        ALTER TABLE "formulario_instancias"
        ADD CONSTRAINT "FK_formulario_instancias_para_quien"
        FOREIGN KEY ("para_quien_id_usuario") REFERENCES "usuarios"("id_usuario")
        ON DELETE RESTRICT ON UPDATE NO ACTION
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_formulario_instancias_formulario"
        ON "formulario_instancias" ("id_formulario")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_formulario_instancias_para_quien"
        ON "formulario_instancias" ("para_quien_id_usuario")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_formulario_instancias_quien_lleno"
        ON "formulario_instancias" ("quien_lleno_id_usuario")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasInstancias = await queryRunner.hasTable('formulario_instancias');
    if (hasInstancias) {
      await queryRunner.query(
        `ALTER TABLE "formulario_instancias" DROP CONSTRAINT "FK_formulario_instancias_para_quien"`,
      );
      await queryRunner.query(
        `ALTER TABLE "formulario_instancias" DROP CONSTRAINT "FK_formulario_instancias_quien_lleno"`,
      );
      await queryRunner.query(
        `ALTER TABLE "formulario_instancias" DROP CONSTRAINT "FK_formulario_instancias_formulario"`,
      );
      await queryRunner.query(`DROP TABLE "formulario_instancias"`);
    }

    const hasFormularios = await queryRunner.hasTable('formularios');
    if (hasFormularios) {
      const table = await queryRunner.getTable('formularios');
      if (table?.findColumnByName('ultimo_publicado_por_id_usuario')) {
        await queryRunner.query(
          `ALTER TABLE "formularios" DROP CONSTRAINT "FK_formularios_ultimo_publicado_por"`,
        );
        await queryRunner.query(
          `ALTER TABLE "formularios" DROP COLUMN "ultimo_publicado_por_id_usuario"`,
        );
      }
      if (table?.findColumnByName('ultimo_guardado_por_id_usuario')) {
        await queryRunner.query(
          `ALTER TABLE "formularios" DROP CONSTRAINT "FK_formularios_ultimo_guardado_por"`,
        );
        await queryRunner.query(
          `ALTER TABLE "formularios" DROP COLUMN "ultimo_guardado_por_id_usuario"`,
        );
      }
      if (table?.findColumnByName('visibilidad_instancias')) {
        await queryRunner.query(
          `ALTER TABLE "formularios" DROP COLUMN "visibilidad_instancias"`,
        );
      }
    }
  }
}
