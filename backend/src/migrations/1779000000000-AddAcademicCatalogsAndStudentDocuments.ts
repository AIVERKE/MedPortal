import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAcademicCatalogsAndStudentDocuments1779000000000
  implements MigrationInterface
{
  name = 'AddAcademicCatalogsAndStudentDocuments1779000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "facultades" ("id_facultad" SERIAL NOT NULL, "nombre" character varying(100) NOT NULL, "activo" boolean NOT NULL DEFAULT true, "deleted_at" TIMESTAMP, CONSTRAINT "UQ_8d4ab9f84f93b1f6787e85f0907" UNIQUE ("nombre"), CONSTRAINT "PK_4bf50b7e91595cbecf87bcdb834" PRIMARY KEY ("id_facultad"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "carreras" ("id_carrera" SERIAL NOT NULL, "nombre" character varying(100) NOT NULL, "activo" boolean NOT NULL DEFAULT true, "deleted_at" TIMESTAMP, "id_facultad" integer NOT NULL, CONSTRAINT "PK_3a76f4ae9347581f0a53f4f9e58" PRIMARY KEY ("id_carrera"))`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "carreras" ADD CONSTRAINT "UQ_carreras_nombre_facultad" UNIQUE ("nombre", "id_facultad");
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(
      `ALTER TABLE "estudiantes" ADD COLUMN IF NOT EXISTS "id_facultad" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "estudiantes" ADD COLUMN IF NOT EXISTS "id_carrera" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "estudiantes" ADD COLUMN IF NOT EXISTS "documento_matricula_url" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "estudiantes" ADD COLUMN IF NOT EXISTS "documento_carnet_url" character varying(255)`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "carreras" ADD CONSTRAINT "FK_220ed09ebf2416a653d3b9140e6" FOREIGN KEY ("id_facultad") REFERENCES "facultades"("id_facultad") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "estudiantes" ADD CONSTRAINT "FK_72f185df17701d935291ca0d8aa" FOREIGN KEY ("id_facultad") REFERENCES "facultades"("id_facultad") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "estudiantes" ADD CONSTRAINT "FK_198fd03c6d1f7bf11cbfd6b7f65" FOREIGN KEY ("id_carrera") REFERENCES "carreras"("id_carrera") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "estudiantes" DROP CONSTRAINT IF EXISTS "FK_198fd03c6d1f7bf11cbfd6b7f65"`,
    );
    await queryRunner.query(
      `ALTER TABLE "estudiantes" DROP CONSTRAINT IF EXISTS "FK_72f185df17701d935291ca0d8aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "carreras" DROP CONSTRAINT IF EXISTS "FK_220ed09ebf2416a653d3b9140e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "estudiantes" DROP COLUMN IF EXISTS "documento_carnet_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "estudiantes" DROP COLUMN IF EXISTS "documento_matricula_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "estudiantes" DROP COLUMN IF EXISTS "id_carrera"`,
    );
    await queryRunner.query(
      `ALTER TABLE "estudiantes" DROP COLUMN IF EXISTS "id_facultad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "carreras" DROP CONSTRAINT IF EXISTS "UQ_carreras_nombre_facultad"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "carreras"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "facultades"`);
  }
}
