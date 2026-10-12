import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds:
//   - library_contents.previewSeconds / previewPages   (nullable admin overrides)
//   - library_content_previews                          (cache of generated preview assets)
//
// See src/migrations/README.md before running this — it explains the
// one-time setup needed now that `synchronize` is off.
export class AddLibraryPreviews1790337600000 implements MigrationInterface {
  name = 'AddLibraryPreviews1790337600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "library_contents"
      ADD COLUMN "previewSeconds" integer,
      ADD COLUMN "previewPages" integer
    `);

    await queryRunner.query(`
      CREATE TYPE "library_content_previews_status_enum" AS ENUM (
        'none', 'pending', 'ready', 'failed', 'not_applicable'
      )
    `);

    // gen_random_uuid() is built into Postgres core since v13 — no
    // uuid-ossp/pgcrypto extension needed. If you're on an older Postgres,
    // swap this for uuid_generate_v4() and CREATE EXTENSION "uuid-ossp".
    await queryRunner.query(`
      CREATE TABLE "library_content_previews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "contentId" uuid NOT NULL,
        "status" "library_content_previews_status_enum" NOT NULL DEFAULT 'none',
        "previewKey" character varying,
        "fileSizeBytes" integer,
        "durationSeconds" integer,
        "pages" integer,
        "sourceFileUrl" character varying NOT NULL,
        "requestedSeconds" integer,
        "requestedPages" integer,
        "error" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_library_content_previews" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_library_content_previews_contentId"
      ON "library_content_previews" ("contentId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_library_content_previews_contentId"`);
    await queryRunner.query(`DROP TABLE "library_content_previews"`);
    await queryRunner.query(`DROP TYPE "library_content_previews_status_enum"`);
    await queryRunner.query(`
      ALTER TABLE "library_contents"
      DROP COLUMN "previewSeconds",
      DROP COLUMN "previewPages"
    `);
  }
}
