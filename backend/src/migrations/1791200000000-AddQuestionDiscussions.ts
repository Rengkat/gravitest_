import { MigrationInterface, QueryRunner } from 'typeorm';

// Question-level discussions:
//   question_contributions   comments + replies, keyed by (questionId, partId)
//   contribution_reactions   one like/dislike per user per contribution (unique)
//   contribution_reports     student reports for moderation (unique per reporter)
//
// IDEMPOTENT like the previous migrations (the app may already have created
// some of this at boot when `synchronize` is on).
//
// Existing structured theory/practical questions get their permanent
// sub-question ids lazily, the first time a discussion for one of their
// parts is opened (DiscussionAccessService.resolveThread) — no data rewrite
// is needed here, and nothing is lost if a question is never discussed.
export class AddQuestionDiscussions1791200000000 implements MigrationInterface {
  name = 'AddQuestionDiscussions1791200000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await q.query(`DO $$ BEGIN
      CREATE TYPE "question_contributions_status_enum" AS ENUM ('visible','hidden','deleted');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await q.query(`DO $$ BEGIN
      CREATE TYPE "contribution_reports_reason_enum" AS ENUM ('spam','abusive','inappropriate','wrong_info','off_topic','other');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await q.query(`DO $$ BEGIN
      CREATE TYPE "contribution_reports_status_enum" AS ENUM ('open','actioned','dismissed');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`);

    await q.query(`
      CREATE TABLE IF NOT EXISTS "question_contributions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "questionId" uuid NOT NULL,
        "partId" character varying(64),
        "userId" uuid,
        "parentId" uuid,
        "replyToId" uuid,
        "content" text NOT NULL,
        "imageUrls" jsonb NOT NULL DEFAULT '[]',
        "likeCount" integer NOT NULL DEFAULT 0,
        "dislikeCount" integer NOT NULL DEFAULT 0,
        "replyCount" integer NOT NULL DEFAULT 0,
        "reportCount" integer NOT NULL DEFAULT 0,
        "status" "question_contributions_status_enum" NOT NULL DEFAULT 'visible',
        "moderationNote" character varying(200),
        "moderatedById" uuid,
        "clientToken" character varying(64),
        "editedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_question_contributions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_contrib_question" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_contrib_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
      )`);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_contrib_thread" ON "question_contributions" ("questionId","partId","parentId","createdAt")`);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_contrib_replies" ON "question_contributions" ("parentId","createdAt")`);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_contrib_user_recent" ON "question_contributions" ("userId","createdAt")`);
    await q.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_contrib_user_token" ON "question_contributions" ("userId","clientToken") WHERE "clientToken" IS NOT NULL`);

    await q.query(`
      CREATE TABLE IF NOT EXISTS "contribution_reactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contributionId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "value" smallint NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contribution_reactions" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_reaction_value" CHECK ("value" IN (1, -1)),
        CONSTRAINT "FK_reaction_contribution" FOREIGN KEY ("contributionId") REFERENCES "question_contributions"("id") ON DELETE CASCADE
      )`);
    await q.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_reaction_contribution_user" ON "contribution_reactions" ("contributionId","userId")`);

    await q.query(`
      CREATE TABLE IF NOT EXISTS "contribution_reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contributionId" uuid NOT NULL,
        "reporterId" uuid NOT NULL,
        "reason" "contribution_reports_reason_enum" NOT NULL,
        "details" character varying(500),
        "status" "contribution_reports_status_enum" NOT NULL DEFAULT 'open',
        "resolvedById" uuid,
        "resolvedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contribution_reports" PRIMARY KEY ("id"),
        CONSTRAINT "FK_report_contribution" FOREIGN KEY ("contributionId") REFERENCES "question_contributions"("id") ON DELETE CASCADE
      )`);
    await q.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_report_contribution_reporter" ON "contribution_reports" ("contributionId","reporterId")`);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_report_status" ON "contribution_reports" ("status","createdAt")`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS "contribution_reports"`);
    await q.query(`DROP TABLE IF EXISTS "contribution_reactions"`);
    await q.query(`DROP TABLE IF EXISTS "question_contributions"`);
    await q.query(`DROP TYPE IF EXISTS "contribution_reports_status_enum"`);
    await q.query(`DROP TYPE IF EXISTS "contribution_reports_reason_enum"`);
    await q.query(`DROP TYPE IF EXISTS "question_contributions_status_enum"`);
  }
}
