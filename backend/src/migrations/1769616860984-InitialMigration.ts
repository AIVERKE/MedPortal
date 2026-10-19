import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1769616860984 implements MigrationInterface {
  name = 'InitialMigration1769616860984';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "estudiantes" ("id_estudiante" SERIAL NOT NULL, "registro_universitario" character varying(50), "carrera" character varying(100), "facultad" character varying(100), "fecha_sincronizacion" TIMESTAMP, "estado_academico" character varying(50), "activo" boolean NOT NULL DEFAULT true, "id_persona" integer, CONSTRAINT "UQ_c83bca1100ddfe44b57a4006af8" UNIQUE ("registro_universitario"), CONSTRAINT "REL_39f1e208ebb1c2fc2b3fd6b10c" UNIQUE ("id_persona"), CONSTRAINT "PK_950806408704dfe32ccbbe0bc48" PRIMARY KEY ("id_estudiante"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "docentes" ("id_docente" SERIAL NOT NULL, "numero_item" character varying(50), "facultad" character varying(100), "fecha_sincronizacion" TIMESTAMP, "interino_contratado" character varying(50), "activo" boolean NOT NULL DEFAULT true, "id_persona" integer, CONSTRAINT "REL_81dc2e2dbccf40aebefbb992ee" UNIQUE ("id_persona"), CONSTRAINT "PK_178349aff786cd23c38f6b55369" PRIMARY KEY ("id_docente"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "administrativos" ("id_administrativo" SERIAL NOT NULL, "numero_item" character varying(50), "unidad" character varying(100), "cargo" character varying(100), "fecha_sincronizacion" TIMESTAMP, "estado_laboral" character varying(50), "id_persona" integer, CONSTRAINT "REL_db3f71bafb0acee33b606a2a35" UNIQUE ("id_persona"), CONSTRAINT "PK_0d4b483b07c3a8a349c3e4d51a7" PRIMARY KEY ("id_administrativo"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "contratos_consultores" ("id_contrato_consultor" SERIAL NOT NULL, "id_servicio" integer, "unidad" character varying(100), "fecha_inicio_contrato" date, "fecha_fin_contrato" date, "cargo" character varying(100), "documento_contrato_url" character varying(255), "id_consultor" integer, CONSTRAINT "PK_64aa4a27169e657ee3a8ee82500" PRIMARY KEY ("id_contrato_consultor"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "consultores" ("id_consultor" SERIAL NOT NULL, "fecha_sincronizacion" TIMESTAMP, "id_persona" integer, CONSTRAINT "REL_f55b272f135f9fa29a5fc2ea35" UNIQUE ("id_persona"), CONSTRAINT "PK_284fde14a2d18de7cc473140214" PRIMARY KEY ("id_consultor"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id_rol" SERIAL NOT NULL, "tipo_rol" character varying(50) NOT NULL, "fecha_asignacion" date NOT NULL DEFAULT ('now'::text)::date, "activo" boolean NOT NULL DEFAULT true, "id_persona" integer, CONSTRAINT "PK_25f8d4161f00a1dd1cbe5068695" PRIMARY KEY ("id_rol"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "historial_usuarios" ("id_historial_usuario" SERIAL NOT NULL, "fecha_hora_acceso" TIMESTAMP NOT NULL DEFAULT now(), "intento_fallido" boolean NOT NULL DEFAULT false, "id_persona" integer, CONSTRAINT "PK_8a7d8e9369af0e72b0296fdc908" PRIMARY KEY ("id_historial_usuario"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "pagos" ("id_pago" SERIAL NOT NULL, "monto" numeric(10,2), "exento" boolean NOT NULL DEFAULT false, "motivo_exencion" text, "fecha_pago" TIMESTAMP NOT NULL DEFAULT now(), "metodo_pago" character varying(50), "id_consulta_medica" integer, "id_usuario_registro_pago" integer, CONSTRAINT "PK_9de763d4d92bbba9933371456de" PRIMARY KEY ("id_pago"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "consultas_medicas" ("id_consulta_medica" SERIAL NOT NULL, "peso_kl" numeric(5,2), "estatura_cm" numeric(5,2), "presion_arterial" character varying(20), "temperatura" numeric(4,2), "frecuencia_cardiaca" integer, "motivo_consulta" text, "sintomas" text, "id_reserva_paciente" integer, "id_doctor" integer, CONSTRAINT "REL_72ad6bf4ea09bdb407d266e951" UNIQUE ("id_reserva_paciente"), CONSTRAINT "PK_eca98de2692edd004bc5d62d4e7" PRIMARY KEY ("id_consulta_medica"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "reservas_paciente" ("id_reserva_paciente" SERIAL NOT NULL, "fecha_cita" date NOT NULL, "hora_inicio_cita" TIME NOT NULL, "hora_fin_cita" TIME NOT NULL, "fecha_solicitud" TIMESTAMP NOT NULL DEFAULT now(), "fecha_cancelacion_cita" TIMESTAMP, "motivo_cancelacion" text, "observaciones" text, "estado" character varying(20) NOT NULL DEFAULT 'PENDIENTE', "id_usuario" integer, "id_especialidad" integer, "id_posta" integer, CONSTRAINT "PK_8b11fa22995708a879dd2559542" PRIMARY KEY ("id_reserva_paciente"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "postas_medicas" ("id_posta" SERIAL NOT NULL, "nombre" character varying(100) NOT NULL, "codigo" character varying(50), "direccion" text, "telefono" character varying(20), "ubicacion_gps" character varying(100), "horario_atencion_manana_inicio" TIME, "horario_atencion_manana_fin" TIME, "horario_atencion_tarde_inicio" TIME, "horario_atencion_tarde_fin" TIME, "activo" boolean NOT NULL DEFAULT true, "fecha_eliminacion" TIMESTAMP, CONSTRAINT "PK_34e39ab9ab87ffcf53c25e7b374" PRIMARY KEY ("id_posta"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "asignacion_doctores_consultorio" ("id_asignacion_doctores_consultorio" SERIAL NOT NULL, "dias_semana" character varying(50), "turno" character varying(20), "hora_inicio" TIME, "hora_fin" TIME, "duracion_cita" integer, "cupos_disponibles" integer, "activo" boolean NOT NULL DEFAULT true, "id_doctor" integer, "id_consultorio" integer, "id_especialidad" integer, CONSTRAINT "PK_19db3a7d742a515fe1c6274fbd0" PRIMARY KEY ("id_asignacion_doctores_consultorio"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "consultorios_especialidad" ("id_consultorio" SERIAL NOT NULL, "fecha_habilitacion" date, "numero_consultorio" character varying(20), "piso_ubicacion" character varying(20), "activo" boolean NOT NULL DEFAULT true, "fecha_eliminacion" TIMESTAMP, "id_posta" integer, "id_especialidad" integer, CONSTRAINT "PK_e549937ab639ce5afc2afb2f0da" PRIMARY KEY ("id_consultorio"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "especialidades_medicas" ("id_especialidad_medica" SERIAL NOT NULL, "nombre" character varying(100) NOT NULL, "codigo" character varying(50), "descripcion" text, "tiempo_cita_por_defecto" integer, "visible" boolean NOT NULL DEFAULT true, "activo" boolean NOT NULL DEFAULT true, "fecha_eliminacion" TIMESTAMP, CONSTRAINT "PK_ab348b870832337be1e28e4adb5" PRIMARY KEY ("id_especialidad_medica"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "doctores" ("id_doctor" SERIAL NOT NULL, "matricula_profesional" character varying(50), "experiencia_profesional" text, "universidad_origen" character varying(100), "titulo_profesional" character varying(100), "telefono_emergencia" character varying(20), "id_persona" integer, "id_especialidad_medica" integer, CONSTRAINT "REL_0add4a0de18db043e780b87387" UNIQUE ("id_persona"), CONSTRAINT "PK_a5ccb92edc97f43ee5269e72850" PRIMARY KEY ("id_doctor"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "personas" ("id_persona" SERIAL NOT NULL, "ci" character varying(20) NOT NULL, "nombres" character varying(100) NOT NULL, "primer_apellido" character varying(100) NOT NULL, "segundo_apellido" character varying(100), "fecha_nacimiento" date, "genero" character varying(20), "celular" character varying(20), "email" character varying(100), "direccion" text, "foto" character varying(255), "fecha_registro" date NOT NULL DEFAULT ('now'::text)::date, "activo" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_3a116924eb37c50413bd4cc2582" UNIQUE ("ci"), CONSTRAINT "PK_a8294b844f4e1849ccf15ae57d1" PRIMARY KEY ("id_persona"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "usuarios" ("id_usuario" SERIAL NOT NULL, "username" character varying(50) NOT NULL, "password" character varying(255) NOT NULL, "bloqueado" boolean NOT NULL DEFAULT false, "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), "id_persona" integer, CONSTRAINT "UQ_9f78cfde576fc28f279e2b7a9cb" UNIQUE ("username"), CONSTRAINT "REL_5b29c4b5cc11b9c67c8b70c9cb" UNIQUE ("id_persona"), CONSTRAINT "PK_dfe59db369749f9042499fd8107" PRIMARY KEY ("id_usuario"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fecha_cierre" ("id_fecha_cierre" SERIAL NOT NULL, "fecha" date NOT NULL, "descripcion" character varying(255), "deleted_at" TIMESTAMP, CONSTRAINT "PK_e47fac432f047232b979946a7b2" PRIMARY KEY ("id_fecha_cierre"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "configuracion_reservas_consultas" ("id_configuracion_reservas_medicas" SERIAL NOT NULL, "dias_semana" character varying(50), "hora_inicio_reserva" TIME, "hora_fin_reserva" TIME, "dias_anticipacion_minima" integer, "dias_anticipacion_maxima" integer, "fecha_eliminacion" TIMESTAMP, CONSTRAINT "PK_b8560a728385a511f74adba98cc" PRIMARY KEY ("id_configuracion_reservas_medicas"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "estudiantes" ADD CONSTRAINT "FK_39f1e208ebb1c2fc2b3fd6b10c8" FOREIGN KEY ("id_persona") REFERENCES "personas"("id_persona") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "docentes" ADD CONSTRAINT "FK_81dc2e2dbccf40aebefbb992ee9" FOREIGN KEY ("id_persona") REFERENCES "personas"("id_persona") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "administrativos" ADD CONSTRAINT "FK_db3f71bafb0acee33b606a2a358" FOREIGN KEY ("id_persona") REFERENCES "personas"("id_persona") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contratos_consultores" ADD CONSTRAINT "FK_14b43e2a4749c4ceb1d202a4b66" FOREIGN KEY ("id_consultor") REFERENCES "consultores"("id_consultor") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultores" ADD CONSTRAINT "FK_f55b272f135f9fa29a5fc2ea356" FOREIGN KEY ("id_persona") REFERENCES "personas"("id_persona") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_9e3d9f3bd2e148efd157284534d" FOREIGN KEY ("id_persona") REFERENCES "personas"("id_persona") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "historial_usuarios" ADD CONSTRAINT "FK_8e15dd5e915b1913b0e419de0b6" FOREIGN KEY ("id_persona") REFERENCES "personas"("id_persona") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pagos" ADD CONSTRAINT "FK_f359e1666aa09ea35e3c818865f" FOREIGN KEY ("id_consulta_medica") REFERENCES "consultas_medicas"("id_consulta_medica") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pagos" ADD CONSTRAINT "FK_0da82c678dd14763c247ca7fe5e" FOREIGN KEY ("id_usuario_registro_pago") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultas_medicas" ADD CONSTRAINT "FK_72ad6bf4ea09bdb407d266e9512" FOREIGN KEY ("id_reserva_paciente") REFERENCES "reservas_paciente"("id_reserva_paciente") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultas_medicas" ADD CONSTRAINT "FK_cad6c92fd412c87040053eb3819" FOREIGN KEY ("id_doctor") REFERENCES "doctores"("id_doctor") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente" ADD CONSTRAINT "FK_eaf0eb3be703790a95a0e91c37b" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente" ADD CONSTRAINT "FK_44b2aad944c8c113c114f876fd7" FOREIGN KEY ("id_especialidad") REFERENCES "especialidades_medicas"("id_especialidad_medica") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente" ADD CONSTRAINT "FK_4c9bb1e681f23e6ab300c80442d" FOREIGN KEY ("id_posta") REFERENCES "postas_medicas"("id_posta") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asignacion_doctores_consultorio" ADD CONSTRAINT "FK_5d9d3a91a60c597d104ada162c2" FOREIGN KEY ("id_doctor") REFERENCES "doctores"("id_doctor") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asignacion_doctores_consultorio" ADD CONSTRAINT "FK_6a52b8c3c306d451667a5e59843" FOREIGN KEY ("id_consultorio") REFERENCES "consultorios_especialidad"("id_consultorio") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asignacion_doctores_consultorio" ADD CONSTRAINT "FK_3130bdfe9df91c7e0b66b93781e" FOREIGN KEY ("id_especialidad") REFERENCES "especialidades_medicas"("id_especialidad_medica") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultorios_especialidad" ADD CONSTRAINT "FK_4195dc97170eb25ef74237e0f95" FOREIGN KEY ("id_posta") REFERENCES "postas_medicas"("id_posta") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultorios_especialidad" ADD CONSTRAINT "FK_58a49c4d896d5676516eca744a5" FOREIGN KEY ("id_especialidad") REFERENCES "especialidades_medicas"("id_especialidad_medica") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctores" ADD CONSTRAINT "FK_0add4a0de18db043e780b873878" FOREIGN KEY ("id_persona") REFERENCES "personas"("id_persona") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctores" ADD CONSTRAINT "FK_d15c16af4f643b52fa369366c09" FOREIGN KEY ("id_especialidad_medica") REFERENCES "especialidades_medicas"("id_especialidad_medica") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD CONSTRAINT "FK_5b29c4b5cc11b9c67c8b70c9cb2" FOREIGN KEY ("id_persona") REFERENCES "personas"("id_persona") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP CONSTRAINT "FK_5b29c4b5cc11b9c67c8b70c9cb2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctores" DROP CONSTRAINT "FK_d15c16af4f643b52fa369366c09"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctores" DROP CONSTRAINT "FK_0add4a0de18db043e780b873878"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultorios_especialidad" DROP CONSTRAINT "FK_58a49c4d896d5676516eca744a5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultorios_especialidad" DROP CONSTRAINT "FK_4195dc97170eb25ef74237e0f95"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asignacion_doctores_consultorio" DROP CONSTRAINT "FK_3130bdfe9df91c7e0b66b93781e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asignacion_doctores_consultorio" DROP CONSTRAINT "FK_6a52b8c3c306d451667a5e59843"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asignacion_doctores_consultorio" DROP CONSTRAINT "FK_5d9d3a91a60c597d104ada162c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente" DROP CONSTRAINT "FK_4c9bb1e681f23e6ab300c80442d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente" DROP CONSTRAINT "FK_44b2aad944c8c113c114f876fd7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas_paciente" DROP CONSTRAINT "FK_eaf0eb3be703790a95a0e91c37b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultas_medicas" DROP CONSTRAINT "FK_cad6c92fd412c87040053eb3819"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultas_medicas" DROP CONSTRAINT "FK_72ad6bf4ea09bdb407d266e9512"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pagos" DROP CONSTRAINT "FK_0da82c678dd14763c247ca7fe5e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pagos" DROP CONSTRAINT "FK_f359e1666aa09ea35e3c818865f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "historial_usuarios" DROP CONSTRAINT "FK_8e15dd5e915b1913b0e419de0b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT "FK_9e3d9f3bd2e148efd157284534d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultores" DROP CONSTRAINT "FK_f55b272f135f9fa29a5fc2ea356"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contratos_consultores" DROP CONSTRAINT "FK_14b43e2a4749c4ceb1d202a4b66"`,
    );
    await queryRunner.query(
      `ALTER TABLE "administrativos" DROP CONSTRAINT "FK_db3f71bafb0acee33b606a2a358"`,
    );
    await queryRunner.query(
      `ALTER TABLE "docentes" DROP CONSTRAINT "FK_81dc2e2dbccf40aebefbb992ee9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "estudiantes" DROP CONSTRAINT "FK_39f1e208ebb1c2fc2b3fd6b10c8"`,
    );
    await queryRunner.query(`DROP TABLE "configuracion_reservas_consultas"`);
    await queryRunner.query(`DROP TABLE "fecha_cierre"`);
    await queryRunner.query(`DROP TABLE "usuarios"`);
    await queryRunner.query(`DROP TABLE "personas"`);
    await queryRunner.query(`DROP TABLE "doctores"`);
    await queryRunner.query(`DROP TABLE "especialidades_medicas"`);
    await queryRunner.query(`DROP TABLE "consultorios_especialidad"`);
    await queryRunner.query(`DROP TABLE "asignacion_doctores_consultorio"`);
    await queryRunner.query(`DROP TABLE "postas_medicas"`);
    await queryRunner.query(`DROP TABLE "reservas_paciente"`);
    await queryRunner.query(`DROP TABLE "consultas_medicas"`);
    await queryRunner.query(`DROP TABLE "pagos"`);
    await queryRunner.query(`DROP TABLE "historial_usuarios"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "consultores"`);
    await queryRunner.query(`DROP TABLE "contratos_consultores"`);
    await queryRunner.query(`DROP TABLE "administrativos"`);
    await queryRunner.query(`DROP TABLE "docentes"`);
    await queryRunner.query(`DROP TABLE "estudiantes"`);
  }
}
