import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAtendidoFieldsToReservas1775578034004 implements MigrationInterface {
    name = 'AddAtendidoFieldsToReservas1775578034004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservas_paciente" ADD "fecha_atendido" date`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente" ADD "hora_atendido" TIME`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservas_paciente" DROP COLUMN "hora_atendido"`);
        await queryRunner.query(`ALTER TABLE "reservas_paciente" DROP COLUMN "fecha_atendido"`);
    }

}
