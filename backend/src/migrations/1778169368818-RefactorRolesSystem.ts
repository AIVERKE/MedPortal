import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorRolesSystem1778169368818 implements MigrationInterface {
    name = 'RefactorRolesSystem1778169368818'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Crear la tabla de asignaciones primero
        await queryRunner.query(`CREATE TABLE "asignacion_roles" ("id_asignacion_rol" SERIAL NOT NULL, "fecha_asignacion" date NOT NULL DEFAULT CURRENT_DATE, "activo" boolean NOT NULL DEFAULT true, "id_persona" integer, "id_rol" integer, CONSTRAINT "PK_55fb309f7aebc8cdd9e09f90591" PRIMARY KEY ("id_asignacion_rol"))`);

        // 2. Extraer roles únicos actuales y prepararlos en la tabla 'roles' (que aún tiene la estructura vieja)
        // Primero renombramos 'tipo_rol' a 'nombre' para que coincida con la nueva entidad
        await queryRunner.query(`ALTER TABLE "roles" RENAME COLUMN "tipo_rol" TO "nombre"`);

        // 3. Crear una tabla temporal para los roles maestros únicos
        await queryRunner.query(`CREATE TABLE "roles_maestros" ("id_rol" SERIAL NOT NULL, "nombre" character varying(50) NOT NULL, CONSTRAINT "PK_roles_maestros" PRIMARY KEY ("id_rol"), CONSTRAINT "UQ_roles_maestros_nombre" UNIQUE ("nombre"))`);

        // 4. Insertar los roles únicos actuales en la tabla maestra
        await queryRunner.query(`INSERT INTO "roles_maestros" ("nombre") SELECT DISTINCT "nombre" FROM "roles"`);

        // 5. Migrar las asignaciones a la nueva tabla vinculando con la tabla maestra
        await queryRunner.query(`INSERT INTO "asignacion_roles" ("id_persona", "fecha_asignacion", "activo", "id_rol") 
            SELECT r."id_persona", r."fecha_asignacion", r."activo", rm."id_rol" 
            FROM "roles" r 
            JOIN "roles_maestros" rm ON r."nombre" = rm."nombre"`);

        // 6. Ahora si, limpiar la tabla 'roles' original para que sea la maestra definitiva
        await queryRunner.query(`DELETE FROM "roles"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "FK_9e3d9f3bd2e148efd157284534d"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "fecha_asignacion"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "activo"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "id_persona"`);
        // La columna ya se llama 'nombre' así que no la dropeamos
        await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "UQ_a5be7aa67e759e347b1c6464e10" UNIQUE ("nombre")`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "deleted_at" TIMESTAMP`);

        // 7. Mover los roles de la tabla temporal a la tabla maestro final
        await queryRunner.query(`INSERT INTO "roles" ("id_rol", "nombre") SELECT "id_rol", "nombre" FROM "roles_maestros"`);
        // Sincronizar el serial de la tabla roles
        await queryRunner.query(`SELECT setval('roles_id_rol_seq', (SELECT MAX(id_rol) FROM roles))`);

        // 8. Borrar tabla temporal
        await queryRunner.query(`DROP TABLE "roles_maestros"`);

        // 9. Añadir las FKs finales
        await queryRunner.query(`ALTER TABLE "asignacion_roles" ADD CONSTRAINT "FK_f2f915cbffbfc910e7e001a8b1e" FOREIGN KEY ("id_persona") REFERENCES "personas"("id_persona") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asignacion_roles" ADD CONSTRAINT "FK_d978d9ecd95075f97369091e38a" FOREIGN KEY ("id_rol") REFERENCES "roles"("id_rol") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // En reversa es más complejo si queremos mantener datos, pero usualmente el down no preserva todo
        await queryRunner.query(`ALTER TABLE "asignacion_roles" DROP CONSTRAINT "FK_d978d9ecd95075f97369091e38a"`);
        await queryRunner.query(`ALTER TABLE "asignacion_roles" DROP CONSTRAINT "FK_f2f915cbffbfc910e7e001a8b1e"`);
        await queryRunner.query(`DROP TABLE "asignacion_roles"`);
        // Revertir cambios en roles
        await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "UQ_a5be7aa67e759e347b1c6464e10"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "id_persona" integer`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "activo" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "fecha_asignacion" date NOT NULL DEFAULT CURRENT_DATE`);
        await queryRunner.query(`ALTER TABLE "roles" RENAME COLUMN "nombre" TO "tipo_rol"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "FK_9e3d9f3bd2e148efd157284534d" FOREIGN KEY ("id_persona") REFERENCES "personas"("id_persona") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
