import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDoctorIdToReserva1771427461470 implements MigrationInterface {
  name = 'AddDoctorIdToReserva1771427461470';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente" ADD "id_doctor" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente" ADD CONSTRAINT "FK_159858fe71fa56337e1bd657f52" FOREIGN KEY ("id_doctor") REFERENCES "doctores"("id_doctor") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente" DROP CONSTRAINT "FK_159858fe71fa56337e1bd657f52"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente" DROP COLUMN "id_doctor"`,
    );
  }
}
