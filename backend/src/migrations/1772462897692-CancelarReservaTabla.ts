import { MigrationInterface, QueryRunner } from 'typeorm';

export class CancelarReservaTabla1772462897692 implements MigrationInterface {
  name = 'CancelarReservaTabla1772462897692';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "postas_medicas" RENAME COLUMN "fecha_eliminacion" TO "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultorios_especialidad" RENAME COLUMN "fecha_eliminacion" TO "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "especialidades_medicas" RENAME COLUMN "fecha_eliminacion" TO "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "configuracion_reservas_consultas" RENAME COLUMN "fecha_eliminacion" TO "deleted_at"`,
    );
    await queryRunner.query(
      `CREATE TABLE "reservas_paciente_canceladas" ("id_reserva_cancelada" SERIAL NOT NULL, "fecha_cita" date NOT NULL, "hora_inicio_cita" TIME NOT NULL, "hora_fin_cita" TIME NOT NULL, "fecha_solicitud" TIMESTAMP NOT NULL, "fecha_cancelacion_cita" TIMESTAMP NOT NULL DEFAULT now(), "motivo_cancelacion" text, "observaciones" text, "estado" character varying(20) NOT NULL DEFAULT 'CANCELADO', "deleted_at" TIMESTAMP, "id_usuario" integer, "id_especialidad" integer, "id_posta" integer, "id_doctor" integer, CONSTRAINT "PK_e02f81630636a3510c320dbacb9" PRIMARY KEY ("id_reserva_cancelada"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "estudiantes" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "docentes" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "administrativos" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "contratos_consultores" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultores" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "asignacion_doctores_consultorio" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctores" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "personas" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "derivaciones" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente" ADD CONSTRAINT "uq_cita_paciente" UNIQUE ("id_usuario", "fecha_cita", "hora_inicio_cita")`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente" ADD CONSTRAINT "uq_doctor_disponibilidad" UNIQUE ("id_doctor", "fecha_cita", "hora_inicio_cita")`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente_canceladas" ADD CONSTRAINT "FK_17a78b7f4f4d6b853efcbf3fe25" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente_canceladas" ADD CONSTRAINT "FK_51f4f18913e73add76b3f97f258" FOREIGN KEY ("id_especialidad") REFERENCES "especialidades_medicas"("id_especialidad_medica") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente_canceladas" ADD CONSTRAINT "FK_7c3964caecb1b6a739d33e5ebd7" FOREIGN KEY ("id_posta") REFERENCES "postas_medicas"("id_posta") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente_canceladas" ADD CONSTRAINT "FK_a05d5b971a233c2fa7e93b0ff85" FOREIGN KEY ("id_doctor") REFERENCES "doctores"("id_doctor") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente_canceladas" DROP CONSTRAINT "FK_a05d5b971a233c2fa7e93b0ff85"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente_canceladas" DROP CONSTRAINT "FK_7c3964caecb1b6a739d33e5ebd7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente_canceladas" DROP CONSTRAINT "FK_51f4f18913e73add76b3f97f258"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente_canceladas" DROP CONSTRAINT "FK_17a78b7f4f4d6b853efcbf3fe25"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente" DROP CONSTRAINT "uq_doctor_disponibilidad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente" DROP CONSTRAINT "uq_cita_paciente"`,
    );
    await queryRunner.query(
      `ALTER TABLE "derivaciones" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(`ALTER TABLE "personas" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "doctores" DROP COLUMN "deleted_at"`);
    await queryRunner.query(
      `ALTER TABLE "asignacion_doctores_consultorio" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultores" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contratos_consultores" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "administrativos" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(`ALTER TABLE "docentes" DROP COLUMN "deleted_at"`);
    await queryRunner.query(
      `ALTER TABLE "estudiantes" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(`DROP TABLE "reservas_paciente_canceladas"`);
    await queryRunner.query(
      `ALTER TABLE "configuracion_reservas_consultas" RENAME COLUMN "deleted_at" TO "fecha_eliminacion"`,
    );
    await queryRunner.query(
      `ALTER TABLE "especialidades_medicas" RENAME COLUMN "deleted_at" TO "fecha_eliminacion"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultorios_especialidad" RENAME COLUMN "deleted_at" TO "fecha_eliminacion"`,
    );
    await queryRunner.query(
      `ALTER TABLE "postas_medicas" RENAME COLUMN "deleted_at" TO "fecha_eliminacion"`,
    );
  }
}
