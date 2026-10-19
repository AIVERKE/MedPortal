import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIdDoctorDerivaciones1773071549281 implements MigrationInterface {
  name = 'AddIdDoctorDerivaciones1773071549281';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "derivaciones" ADD "id_doctor" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "derivaciones" ADD CONSTRAINT "FK_17e47237d40f19b5b5fd485ead1" FOREIGN KEY ("id_doctor") REFERENCES "doctores"("id_doctor") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "derivaciones" DROP CONSTRAINT "FK_17e47237d40f19b5b5fd485ead1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "derivaciones" DROP COLUMN "id_doctor"`,
    );
  }
}
