import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConfiguracionDiasSemana1772551851819 implements MigrationInterface {
  name = 'ConfiguracionDiasSemana1772551851819';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "configuracion_reservas_consultas" DROP COLUMN "dias_semana"`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracion_reservas_consultas" ADD "dias_semana" character varying(100)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "configuracion_reservas_consultas" DROP COLUMN "dias_semana"`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracion_reservas_consultas" ADD "dias_semana" character varying(50)`,
    );
  }
}
