import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompartirTelefonoEmergenciaDoctor1780000000000
  implements MigrationInterface
{
  name = 'AddCompartirTelefonoEmergenciaDoctor1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasCol = await queryRunner.hasColumn(
      'doctores',
      'compartir_telefono_emergencia',
    );
    if (hasCol) return;

    await queryRunner.query(`
      ALTER TABLE "doctores"
      ADD "compartir_telefono_emergencia" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasCol = await queryRunner.hasColumn(
      'doctores',
      'compartir_telefono_emergencia',
    );
    if (!hasCol) return;

    await queryRunner.query(`
      ALTER TABLE "doctores"
      DROP COLUMN "compartir_telefono_emergencia"
    `);
  }
}
