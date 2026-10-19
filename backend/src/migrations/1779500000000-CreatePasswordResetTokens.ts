import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetTokens1779500000000
  implements MigrationInterface
{
  name = 'CreatePasswordResetTokens1779500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('password_reset_tokens');
    if (hasTable) return;

    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id_password_reset_token" SERIAL NOT NULL,
        "token_hash" character varying(64) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "used_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "id_usuario" integer,
        CONSTRAINT "UQ_password_reset_tokens_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("id_password_reset_token")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "password_reset_tokens"
      ADD CONSTRAINT "FK_password_reset_tokens_usuario"
      FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_password_reset_tokens_usuario"`,
    );
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
  }
}
