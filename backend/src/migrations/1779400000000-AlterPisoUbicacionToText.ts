import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPisoUbicacionToText1779400000000
  implements MigrationInterface
{
  name = 'AlterPisoUbicacionToText1779400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "consultorios_especialidad"
      ALTER COLUMN "piso_ubicacion" TYPE text
      USING "piso_ubicacion"::text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "consultorios_especialidad"
      ALTER COLUMN "piso_ubicacion" TYPE character varying(20)
      USING LEFT("piso_ubicacion"::text, 20)
    `);
  }
}
