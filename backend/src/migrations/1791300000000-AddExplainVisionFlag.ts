import { MigrationInterface, QueryRunner } from 'typeorm';

// ai_explanation_cache.visionUsed — whether the model was actually shown the question's image(s).
//
// Until now a question with a diagram whose vision call failed was silently explained from the text
// alone, and that text-only answer was cached and served to every later student. Existing rows all
// default to `false`, so for questions that have images they are ignored and regenerated with the
// real diagram the next time they are requested. Text-only questions are unaffected.
//
// Idempotent, like the other migrations here.
export class AddExplainVisionFlag1791300000000 implements MigrationInterface {
  name = 'AddExplainVisionFlag1791300000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "ai_explanation_cache" ADD COLUMN IF NOT EXISTS "visionUsed" boolean NOT NULL DEFAULT false`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "ai_explanation_cache" DROP COLUMN IF EXISTS "visionUsed"`);
  }
}
