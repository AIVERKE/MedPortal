import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTableDerivaciones1771611416719 implements MigrationInterface {
  name = 'AddTableDerivaciones1771611416719';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "derivaciones" ("id_derivacion" SERIAL NOT NULL, "id_usuario" integer NOT NULL, "id_especialidad" integer NOT NULL, "fecha" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_70c839a8ad583fdd503ce363a62" PRIMARY KEY ("id_derivacion"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "derivaciones" ADD CONSTRAINT "FK_989c7b02672d39e97ab0e55ec0b" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "derivaciones" ADD CONSTRAINT "FK_d3bbf415ccbc2211bd44e5b02bf" FOREIGN KEY ("id_especialidad") REFERENCES "especialidades_medicas"("id_especialidad_medica") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "derivaciones" DROP CONSTRAINT "FK_d3bbf415ccbc2211bd44e5b02bf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "derivaciones" DROP CONSTRAINT "FK_989c7b02672d39e97ab0e55ec0b"`,
    );
    await queryRunner.query(`DROP TABLE "derivaciones"`);
  }
}
