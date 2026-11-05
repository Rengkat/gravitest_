import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds (admin-managed public website content):
//   - site_blocks     one JSON document per editable page section (home hero, footer, …)
//   - content_items   rows of admin-managed lists (videos, FAQs, testimonials, …)
//   - blog_posts.category   enum  ->  varchar(60), so admins can add/rename blog
//                           categories without a migration (existing values kept)
//
// IDEMPOTENT on purpose, same as the previous migration: with `synchronize: true`
// the app may already have created some of this at boot.
//
// Starter content is NOT inserted here — SiteContentService seeds it once on
// first boot, validated against the same schema the admin dashboard uses.
export class AddSiteContentCms1791100000000 implements MigrationInterface {
  name = 'AddSiteContentCms1791100000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await q.query(`
      CREATE TABLE IF NOT EXISTS "site_blocks" (
        "key" character varying(80) NOT NULL,
        "data" jsonb NOT NULL DEFAULT '{}',
        "updatedById" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_site_blocks_key" PRIMARY KEY ("key")
      )`);

    await q.query(`
      CREATE TABLE IF NOT EXISTS "content_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "collection" character varying(60) NOT NULL,
        "data" jsonb NOT NULL DEFAULT '{}',
        "sortOrder" integer NOT NULL DEFAULT '0',
        "isPublished" boolean NOT NULL DEFAULT false,
        "publishedAt" TIMESTAMP WITH TIME ZONE,
        "updatedById" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_content_items_id" PRIMARY KEY ("id")
      )`);
    await q.query(`
      CREATE INDEX IF NOT EXISTS "IDX_content_items_collection_published_sort"
      ON "content_items" ("collection", "isPublished", "sortOrder")`);

    // blog_posts.category: enum -> varchar. A no-op if it already is varchar.
    await q.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'blog_posts' AND column_name = 'category'
            AND data_type = 'USER-DEFINED'
        ) THEN
          ALTER TABLE "blog_posts"
            ALTER COLUMN "category" TYPE character varying(60) USING "category"::text;
        END IF;
      END $$`);
    await q.query(`DROP TYPE IF EXISTS "public"."blog_posts_category_enum"`);
    await q.query(`
      CREATE INDEX IF NOT EXISTS "IDX_blog_posts_category" ON "blog_posts" ("category")`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS "IDX_blog_posts_category"`);
    // Restoring the enum would fail for any category created after this
    // migration; those posts must be re-filed first. Intentionally left as varchar.
    await q.query(`DROP INDEX IF EXISTS "IDX_content_items_collection_published_sort"`);
    await q.query(`DROP TABLE IF EXISTS "content_items"`);
    await q.query(`DROP TABLE IF EXISTS "site_blocks"`);
  }
}
