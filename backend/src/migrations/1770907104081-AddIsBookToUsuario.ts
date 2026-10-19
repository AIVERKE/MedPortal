import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsBookToUsuario1770907104081 implements MigrationInterface {
  name = 'AddIsBookToUsuario1770907104081';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "is_book" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "deleted_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "is_book"`);
  }
}
