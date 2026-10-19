import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescripcionBloqueoHorario1779700000000
  implements MigrationInterface
{
  name = 'AddDescripcionBloqueoHorario1779700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasCol = await queryRunner.hasColumn(
      'bloqueos_horario_doctor',
      'descripcion',
    );
    if (hasCol) return;

    await queryRunner.query(`
      ALTER TABLE "bloqueos_horario_doctor"
      ADD "descripcion" character varying(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasCol = await queryRunner.hasColumn(
      'bloqueos_horario_doctor',
      'descripcion',
    );
    if (!hasCol) return;

    await queryRunner.query(`
      ALTER TABLE "bloqueos_horario_doctor"
      DROP COLUMN "descripcion"
    `);
  }
}
