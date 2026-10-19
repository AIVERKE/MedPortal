import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEmergenciasTable1775575787369 implements MigrationInterface {
    name = 'CreateEmergenciasTable1775575787369'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "emergencias" ("id_emergencia" SERIAL NOT NULL, "nombre_paciente" character varying(255) NOT NULL, "fecha_atencion" date NOT NULL, "hora_inicio" TIME NOT NULL, "hora_fin" TIME NOT NULL, "descripcion_caso" text NOT NULL, "deleted_at" TIMESTAMP, "id_doctor" integer, CONSTRAINT "PK_7020f6bb80a126424b9237b0bb1" PRIMARY KEY ("id_emergencia"))`);
        await queryRunner.query(`ALTER TABLE "emergencias" ADD CONSTRAINT "FK_05b93f18a51b25e5094a9517fc4" FOREIGN KEY ("id_doctor") REFERENCES "doctores"("id_doctor") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "emergencias" DROP CONSTRAINT "FK_05b93f18a51b25e5094a9517fc4"`);
        await queryRunner.query(`DROP TABLE "emergencias"`);
    }

}
