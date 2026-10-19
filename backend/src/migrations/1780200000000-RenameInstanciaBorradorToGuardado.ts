import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameInstanciaBorradorToGuardado1780200000000
  implements MigrationInterface
{
  name = 'RenameInstanciaBorradorToGuardado1780200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('formulario_instancias');
    if (!hasTable) return;

    await queryRunner.query(`
      UPDATE "formulario_instancias"
      SET "estado" = 'guardado'
      WHERE "estado" = 'borrador'
    `);

    await queryRunner.query(`
      ALTER TABLE "formulario_instancias"
      ALTER COLUMN "estado" SET DEFAULT 'enviado'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('formulario_instancias');
    if (!hasTable) return;

    await queryRunner.query(`
      UPDATE "formulario_instancias"
      SET "estado" = 'borrador'
      WHERE "estado" = 'guardado'
    `);
  }
}
