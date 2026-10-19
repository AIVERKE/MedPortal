import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMotivoReagendacionReserva1780400000000
  implements MigrationInterface
{
  name = 'AddMotivoReagendacionReserva1780400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasCol = await queryRunner.hasColumn(
      'reservas_paciente',
      'motivo_reagendacion',
    );
    if (hasCol) return;

    await queryRunner.query(`
      ALTER TABLE "reservas_paciente"
      ADD "motivo_reagendacion" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasCol = await queryRunner.hasColumn(
      'reservas_paciente',
      'motivo_reagendacion',
    );
    if (!hasCol) return;

    await queryRunner.query(`
      ALTER TABLE "reservas_paciente"
      DROP COLUMN "motivo_reagendacion"
    `);
  }
}
