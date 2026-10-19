import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateConsejoDiario1773417927978 implements MigrationInterface {
  name = 'UpdateConsejoDiario1773417927978';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('consejo_diario');
    if (!table) return;

    // Drop 'consejo' only if it exists
    if (table.findColumnByName('consejo')) {
      await queryRunner.query(
        `ALTER TABLE "consejo_diario" DROP COLUMN "consejo"`,
      );
    }

    // Add columns only if they don't exist
    if (!table.findColumnByName('titulo')) {
      await queryRunner.query(
        `ALTER TABLE "consejo_diario" ADD "titulo" character varying(150) NOT NULL`,
      );
    }
    if (!table.findColumnByName('contenido')) {
      await queryRunner.query(
        `ALTER TABLE "consejo_diario" ADD "contenido" text NOT NULL`,
      );
    }
    if (!table.findColumnByName('categoria')) {
      await queryRunner.query(
        `ALTER TABLE "consejo_diario" ADD "categoria" character varying(50)`,
      );
    }
    if (!table.findColumnByName('fechaPublicacion')) {
      await queryRunner.query(
        `ALTER TABLE "consejo_diario" ADD "fechaPublicacion" date`,
      );
    }
    if (!table.findColumnByName('activo')) {
      await queryRunner.query(
        `ALTER TABLE "consejo_diario" ADD "activo" boolean NOT NULL DEFAULT true`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('consejo_diario');
    if (!table) return;

    if (table.findColumnByName('activo'))
      await queryRunner.query(
        `ALTER TABLE "consejo_diario" DROP COLUMN "activo"`,
      );
    if (table.findColumnByName('fechaPublicacion'))
      await queryRunner.query(
        `ALTER TABLE "consejo_diario" DROP COLUMN "fechaPublicacion"`,
      );
    if (table.findColumnByName('categoria'))
      await queryRunner.query(
        `ALTER TABLE "consejo_diario" DROP COLUMN "categoria"`,
      );
    if (table.findColumnByName('contenido'))
      await queryRunner.query(
        `ALTER TABLE "consejo_diario" DROP COLUMN "contenido"`,
      );
    if (table.findColumnByName('titulo'))
      await queryRunner.query(
        `ALTER TABLE "consejo_diario" DROP COLUMN "titulo"`,
      );

    if (!table.findColumnByName('consejo')) {
      await queryRunner.query(
        `ALTER TABLE "consejo_diario" ADD "consejo" character varying(200) NOT NULL`,
      );
    }
  }
}
