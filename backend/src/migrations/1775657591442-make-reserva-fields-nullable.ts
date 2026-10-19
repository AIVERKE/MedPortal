import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeReservaFieldsNullable1775657591442 implements MigrationInterface {
    name = 'MakeReservaFieldsNullable1775657591442'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservas_paciente" DROP CONSTRAINT "uq_cita_paciente"`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente" DROP CONSTRAINT "uq_doctor_disponibilidad"`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente" ALTER COLUMN "fecha_cita" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente" ALTER COLUMN "hora_inicio_cita" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente" ALTER COLUMN "hora_fin_cita" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente_canceladas" ALTER COLUMN "fecha_cita" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente_canceladas" ALTER COLUMN "hora_inicio_cita" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente_canceladas" ALTER COLUMN "hora_fin_cita" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente" ADD CONSTRAINT "uq_cita_paciente" UNIQUE ("id_usuario", "fecha_cita", "hora_inicio_cita")`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente" ADD CONSTRAINT "uq_doctor_disponibilidad" UNIQUE ("id_doctor", "fecha_cita", "hora_inicio_cita")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservas_paciente" DROP CONSTRAINT "uq_doctor_disponibilidad"`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente" DROP CONSTRAINT "uq_cita_paciente"`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente_canceladas" ALTER COLUMN "hora_fin_cita" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente_canceladas" ALTER COLUMN "hora_inicio_cita" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente_canceladas" ALTER COLUMN "fecha_cita" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente" ALTER COLUMN "hora_fin_cita" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente" ALTER COLUMN "hora_inicio_cita" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente" ALTER COLUMN "fecha_cita" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente" ADD CONSTRAINT "uq_doctor_disponibilidad" UNIQUE ("fecha_cita", "hora_inicio_cita", "id_doctor")`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente" ADD CONSTRAINT "uq_cita_paciente" UNIQUE ("fecha_cita", "hora_inicio_cita", "id_usuario")`);
    }

}
