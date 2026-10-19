import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormulariosTables1779800000000 implements MigrationInterface {
  name = 'CreateFormulariosTables1779800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasFormularios = await queryRunner.hasTable('formularios');
    if (!hasFormularios) {
      await queryRunner.query(`
        CREATE TABLE "formularios" (
          "id_formulario" SERIAL NOT NULL,
          "titulo" character varying(255) NOT NULL DEFAULT 'Formulario sin título',
          "descripcion" text,
          "categoria" character varying(50),
          "estado" character varying(20) NOT NULL DEFAULT 'borrador',
          "fill_mode" character varying(20) NOT NULL DEFAULT 'single',
          "fill_limit" integer,
          "definicion_borrador" jsonb NOT NULL DEFAULT '{"sections":[]}'::jsonb,
          "definicion_publicada" jsonb,
          "publicado_en" TIMESTAMPTZ,
          "guardado_en" TIMESTAMPTZ,
          "creado_por_id_persona" integer,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMPTZ,
          CONSTRAINT "PK_formularios" PRIMARY KEY ("id_formulario")
        )
      `);

      await queryRunner.query(`
        ALTER TABLE "formularios"
        ADD CONSTRAINT "FK_formularios_creado_por"
        FOREIGN KEY ("creado_por_id_persona") REFERENCES "personas"("id_persona")
        ON DELETE SET NULL ON UPDATE NO ACTION
      `);
    }

    const hasPermisos = await queryRunner.hasTable('formulario_permisos_rol');
    if (!hasPermisos) {
      await queryRunner.query(`
        CREATE TABLE "formulario_permisos_rol" (
          "id_formulario_permiso" SERIAL NOT NULL,
          "id_formulario" integer NOT NULL,
          "id_rol" integer NOT NULL,
          "can_view" boolean NOT NULL DEFAULT false,
          "can_fill" boolean NOT NULL DEFAULT false,
          "can_edit" boolean NOT NULL DEFAULT false,
          "can_delete" boolean NOT NULL DEFAULT false,
          CONSTRAINT "PK_formulario_permisos_rol" PRIMARY KEY ("id_formulario_permiso"),
          CONSTRAINT "UQ_formulario_permiso_rol" UNIQUE ("id_formulario", "id_rol")
        )
      `);

      await queryRunner.query(`
        ALTER TABLE "formulario_permisos_rol"
        ADD CONSTRAINT "FK_formulario_permisos_formulario"
        FOREIGN KEY ("id_formulario") REFERENCES "formularios"("id_formulario")
        ON DELETE CASCADE ON UPDATE NO ACTION
      `);

      await queryRunner.query(`
        ALTER TABLE "formulario_permisos_rol"
        ADD CONSTRAINT "FK_formulario_permisos_rol"
        FOREIGN KEY ("id_rol") REFERENCES "roles"("id_rol")
        ON DELETE CASCADE ON UPDATE NO ACTION
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasPermisos = await queryRunner.hasTable('formulario_permisos_rol');
    if (hasPermisos) {
      await queryRunner.query(
        `ALTER TABLE "formulario_permisos_rol" DROP CONSTRAINT "FK_formulario_permisos_rol"`,
      );
      await queryRunner.query(
        `ALTER TABLE "formulario_permisos_rol" DROP CONSTRAINT "FK_formulario_permisos_formulario"`,
      );
      await queryRunner.query(`DROP TABLE "formulario_permisos_rol"`);
    }

    const hasFormularios = await queryRunner.hasTable('formularios');
    if (hasFormularios) {
      await queryRunner.query(
        `ALTER TABLE "formularios" DROP CONSTRAINT "FK_formularios_creado_por"`,
      );
      await queryRunner.query(`DROP TABLE "formularios"`);
    }
  }
}
