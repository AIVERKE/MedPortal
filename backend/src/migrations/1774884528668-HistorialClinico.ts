import { MigrationInterface, QueryRunner } from "typeorm";

export class HistorialClinico1774884528668 implements MigrationInterface {
    name = 'HistorialClinico1774884528668'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "derivaciones" DROP CONSTRAINT "FK_17e47237d40f19b5b5fd485ead1"`);
        await queryRunner.query(`ALTER TABLE "derivaciones" DROP CONSTRAINT "FK_989c7b02672d39e97ab0e55ec0b"`);
        await queryRunner.query(`CREATE TABLE "historia_clinica" ("id_hcl" SERIAL NOT NULL, "id_persona" integer NOT NULL, CONSTRAINT "REL_03e20292fe3c087326b6bbeef6" UNIQUE ("id_persona"), CONSTRAINT "PK_43a28fff5254504eaec80f2fb83" PRIMARY KEY ("id_hcl"))`);
        await queryRunner.query(`CREATE TABLE "cat_enfermedades" ("id_enfermedad" SERIAL NOT NULL, "codigo_cie10" character varying(20), "nombre_enfermedad" character varying(255) NOT NULL, "es_cronica" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_baea6745e1822310021cc7f55c4" PRIMARY KEY ("id_enfermedad"))`);
        await queryRunner.query(`CREATE TABLE "consulta" ("id_consulta" SERIAL NOT NULL, "id_hcl" integer NOT NULL, "id_reserva_paciente" integer, "id_doctor" integer NOT NULL, "id_enfermedad" integer, "enfermedad_especificacion" character varying(255), "motivo_consulta" text, "impresion_diagnostica" text, "conducta_tratamiento" text, "evolucion" text, "fecha_consulta" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0dd3eb193812c0748f16a9bd9d2" PRIMARY KEY ("id_consulta"))`);
        await queryRunner.query(`CREATE TABLE "cat_antecedentes_no_pat" ("id_cat_ant_no_pat" SERIAL NOT NULL, "nombre_antecedente" character varying(150) NOT NULL, "descripcion" text, CONSTRAINT "PK_abcb3ae755edbe93cacb2e18b35" PRIMARY KEY ("id_cat_ant_no_pat"))`);
        await queryRunner.query(`CREATE TABLE "hcl_no_patologicos" ("id_no_patologico" SERIAL NOT NULL, "id_consulta" integer NOT NULL, "id_hcl" integer NOT NULL, "id_cat_ant_no_pat" integer NOT NULL, "observacion" text, "fecha_registro" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_85de9bb76c5a2efd78e83b78fcb" PRIMARY KEY ("id_no_patologico"))`);
        await queryRunner.query(`CREATE TABLE "hcl_psicologia_notas" ("id_nota_psic" SERIAL NOT NULL, "id_hcl" integer NOT NULL, "id_reserva_paciente" integer, "id_psicologo" integer NOT NULL, "nro_sesion" integer NOT NULL DEFAULT '1', "motivo_consulta" text, "bitacora_confidencial" text, "diagnostico_psic" text, "fecha_hora" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7afbebbbf3f0ca01526b5050a73" PRIMARY KEY ("id_nota_psic"))`);
        await queryRunner.query(`CREATE TABLE "hcl_examen_fisico" ("id_examen_fisico" SERIAL NOT NULL, "id_consulta" integer NOT NULL, "presion_arterial" character varying(50), "pulso" integer, "temperatura" numeric(5,2), "peso_kg" numeric(5,2), "talla_cm" numeric(5,2), "imc" numeric(5,2), "sistemas_json" jsonb, "observaciones_fisicas" text, CONSTRAINT "PK_65f3386f65dbc881898d63e743a" PRIMARY KEY ("id_examen_fisico"))`);
        await queryRunner.query(`CREATE TABLE "hcl_ant_go" ("id_ant_go" SERIAL NOT NULL, "id_consulta" integer NOT NULL, "gestas" integer NOT NULL DEFAULT '0', "partos" integer NOT NULL DEFAULT '0', "abortos" integer NOT NULL DEFAULT '0', "fum" date, "ritmo_menstrual" character varying(150), "planificacion_familiar" boolean NOT NULL DEFAULT false, "metodo_descripcion" text, "fup_fua" date, CONSTRAINT "PK_edac0922c157d74f22ab31ba289" PRIMARY KEY ("id_ant_go"))`);
        await queryRunner.query(`ALTER TABLE "derivaciones" DROP COLUMN "id_usuario"`);
        await queryRunner.query(`ALTER TABLE "derivaciones" DROP COLUMN "fecha"`);
        await queryRunner.query(`ALTER TABLE "derivaciones" DROP COLUMN "id_doctor"`);
        await queryRunner.query(`ALTER TABLE "derivaciones" ADD "id_hcl" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "derivaciones" ADD "id_consulta_origen" integer`);
        await queryRunner.query(`ALTER TABLE "derivaciones" ADD "id_doctor_emisor" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "derivaciones" ADD "motivo_referencia" text`);
        await queryRunner.query(`ALTER TABLE "derivaciones" ADD "diagnostico_presuntivo" text`);
        await queryRunner.query(`ALTER TABLE "derivaciones" ADD "resumen_salud" text`);
        await queryRunner.query(`ALTER TABLE "derivaciones" ADD "estado" character varying(50) NOT NULL DEFAULT 'PENDIENTE'`);
        await queryRunner.query(`ALTER TABLE "derivaciones" ADD "fecha_emision" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "historia_clinica" ADD CONSTRAINT "FK_03e20292fe3c087326b6bbeef6f" FOREIGN KEY ("id_persona") REFERENCES "personas"("id_persona") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "consulta" ADD CONSTRAINT "FK_9372c34b46f8fd89b597416b5af" FOREIGN KEY ("id_hcl") REFERENCES "historia_clinica"("id_hcl") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "consulta" ADD CONSTRAINT "FK_9ef7e81e59540fea458439bacc8" FOREIGN KEY ("id_reserva_paciente") REFERENCES "reservas_paciente"("id_reserva_paciente") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "consulta" ADD CONSTRAINT "FK_91141f90f7ecbe42c8f3de73f9b" FOREIGN KEY ("id_doctor") REFERENCES "doctores"("id_doctor") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "consulta" ADD CONSTRAINT "FK_fb16eab6ec6f1b4df31c055c7ee" FOREIGN KEY ("id_enfermedad") REFERENCES "cat_enfermedades"("id_enfermedad") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "derivaciones" ADD CONSTRAINT "FK_b856400e734831362efee9da53d" FOREIGN KEY ("id_hcl") REFERENCES "historia_clinica"("id_hcl") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "derivaciones" ADD CONSTRAINT "FK_b87fc5413fc869275144f3d715d" FOREIGN KEY ("id_consulta_origen") REFERENCES "consulta"("id_consulta") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "derivaciones" ADD CONSTRAINT "FK_480b8d82f8129937f180ae06136" FOREIGN KEY ("id_doctor_emisor") REFERENCES "doctores"("id_doctor") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hcl_no_patologicos" ADD CONSTRAINT "FK_62f41f33866bf500def8a5213c4" FOREIGN KEY ("id_consulta") REFERENCES "consulta"("id_consulta") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hcl_no_patologicos" ADD CONSTRAINT "FK_876d323a556f60a64093acdf031" FOREIGN KEY ("id_hcl") REFERENCES "historia_clinica"("id_hcl") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hcl_no_patologicos" ADD CONSTRAINT "FK_46794d78453fb18183aabbe4540" FOREIGN KEY ("id_cat_ant_no_pat") REFERENCES "cat_antecedentes_no_pat"("id_cat_ant_no_pat") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hcl_psicologia_notas" ADD CONSTRAINT "FK_e99e993ae953daebce23afbe903" FOREIGN KEY ("id_hcl") REFERENCES "historia_clinica"("id_hcl") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hcl_psicologia_notas" ADD CONSTRAINT "FK_34a1c0aaf46110fab668ddc4a42" FOREIGN KEY ("id_reserva_paciente") REFERENCES "reservas_paciente"("id_reserva_paciente") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hcl_psicologia_notas" ADD CONSTRAINT "FK_422719d2fbd430a534f606c93bb" FOREIGN KEY ("id_psicologo") REFERENCES "doctores"("id_doctor") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hcl_examen_fisico" ADD CONSTRAINT "FK_0bbbaa3e1af1ed56ce2285dd279" FOREIGN KEY ("id_consulta") REFERENCES "consulta"("id_consulta") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hcl_ant_go" ADD CONSTRAINT "FK_079e929debb2d87ad0661e23533" FOREIGN KEY ("id_consulta") REFERENCES "consulta"("id_consulta") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hcl_ant_go" DROP CONSTRAINT "FK_079e929debb2d87ad0661e23533"`);
        await queryRunner.query(`ALTER TABLE "hcl_examen_fisico" DROP CONSTRAINT "FK_0bbbaa3e1af1ed56ce2285dd279"`);
        await queryRunner.query(`ALTER TABLE "hcl_psicologia_notas" DROP CONSTRAINT "FK_422719d2fbd430a534f606c93bb"`);
        await queryRunner.query(`ALTER TABLE "hcl_psicologia_notas" DROP CONSTRAINT "FK_34a1c0aaf46110fab668ddc4a42"`);
        await queryRunner.query(`ALTER TABLE "hcl_psicologia_notas" DROP CONSTRAINT "FK_e99e993ae953daebce23afbe903"`);
        await queryRunner.query(`ALTER TABLE "hcl_no_patologicos" DROP CONSTRAINT "FK_46794d78453fb18183aabbe4540"`);
        await queryRunner.query(`ALTER TABLE "hcl_no_patologicos" DROP CONSTRAINT "FK_876d323a556f60a64093acdf031"`);
        await queryRunner.query(`ALTER TABLE "hcl_no_patologicos" DROP CONSTRAINT "FK_62f41f33866bf500def8a5213c4"`);
        await queryRunner.query(`ALTER TABLE "derivaciones" DROP CONSTRAINT "FK_480b8d82f8129937f180ae06136"`);
        await queryRunner.query(`ALTER TABLE "derivaciones" DROP CONSTRAINT "FK_b87fc5413fc869275144f3d715d"`);
        await queryRunner.query(`ALTER TABLE "derivaciones" DROP CONSTRAINT "FK_b856400e734831362efee9da53d"`);
        await queryRunner.query(`ALTER TABLE "consulta" DROP CONSTRAINT "FK_fb16eab6ec6f1b4df31c055c7ee"`);
        await queryRunner.query(`ALTER TABLE "consulta" DROP CONSTRAINT "FK_91141f90f7ecbe42c8f3de73f9b"`);
        await queryRunner.query(`ALTER TABLE "consulta" DROP CONSTRAINT "FK_9ef7e81e59540fea458439bacc8"`);
        await queryRunner.query(`ALTER TABLE "consulta" DROP CONSTRAINT "FK_9372c34b46f8fd89b597416b5af"`);
        await queryRunner.query(`ALTER TABLE "historia_clinica" DROP CONSTRAINT "FK_03e20292fe3c087326b6bbeef6f"`);
        await queryRunner.query(`ALTER TABLE "derivaciones" DROP COLUMN "fecha_emision"`);
        await queryRunner.query(`ALTER TABLE "derivaciones" DROP COLUMN "estado"`);
        await queryRunner.query(`ALTER TABLE "derivaciones" DROP COLUMN "resumen_salud"`);
        await queryRunner.query(`ALTER TABLE "derivaciones" DROP COLUMN "diagnostico_presuntivo"`);
        await queryRunner.query(`ALTER TABLE "derivaciones" DROP COLUMN "motivo_referencia"`);
        await queryRunner.query(`ALTER TABLE "derivaciones" DROP COLUMN "id_doctor_emisor"`);
        await queryRunner.query(`ALTER TABLE "derivaciones" DROP COLUMN "id_consulta_origen"`);
        await queryRunner.query(`ALTER TABLE "derivaciones" DROP COLUMN "id_hcl"`);
        await queryRunner.query(`ALTER TABLE "derivaciones" ADD "id_doctor" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "derivaciones" ADD "fecha" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "derivaciones" ADD "id_usuario" integer NOT NULL`);
        await queryRunner.query(`DROP TABLE "hcl_ant_go"`);
        await queryRunner.query(`DROP TABLE "hcl_examen_fisico"`);
        await queryRunner.query(`DROP TABLE "hcl_psicologia_notas"`);
        await queryRunner.query(`DROP TABLE "hcl_no_patologicos"`);
        await queryRunner.query(`DROP TABLE "cat_antecedentes_no_pat"`);
        await queryRunner.query(`DROP TABLE "consulta"`);
        await queryRunner.query(`DROP TABLE "cat_enfermedades"`);
        await queryRunner.query(`DROP TABLE "historia_clinica"`);
        await queryRunner.query(`ALTER TABLE "derivaciones" ADD CONSTRAINT "FK_989c7b02672d39e97ab0e55ec0b" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "derivaciones" ADD CONSTRAINT "FK_17e47237d40f19b5b5fd485ead1" FOREIGN KEY ("id_doctor") REFERENCES "doctores"("id_doctor") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
