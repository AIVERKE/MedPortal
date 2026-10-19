import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsejoDelDia1772549013785 implements MigrationInterface {
  name = 'ConsejoDelDia1772549013785';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "consejo_diario" ("idConsejoDiario" SERIAL NOT NULL, "consejo" character varying(200) NOT NULL, "fecha_creacion" date NOT NULL DEFAULT now(), CONSTRAINT "PK_dcab5dffad9ade2545d85f2b140" PRIMARY KEY ("idConsejoDiario"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "consejo_diario"`);
  }
}
