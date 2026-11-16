import { MigrationInterface, QueryRunner } from 'typeorm';

// exam_sessions.scorePoints / maxPoints — marks earned and marks available.
//
// Until now a session's percentage was (questions counted correct) ÷ (questions), and a theory/practical
// question only counted if it reached a 50% pass mark — all or nothing. A student who earned 2 of 6 marks
// on their only theory question therefore scored 0% overall. Percentage is now points earned ÷ points
// available (objective question = 1 point, theory/practical = its marks).
//
// Columns are nullable: existing rows stay NULL and are recalculated in the background at startup by
// SessionScoreBackfillService (no SQL guesswork here — it needs each answer's marks). Until then a NULL
// row keeps showing its old percentage. Idempotent, like the other migrations.
export class AddSessionMarksScoring1791400000000 implements MigrationInterface {
  name = 'AddSessionMarksScoring1791400000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "exam_sessions" ADD COLUMN IF NOT EXISTS "scorePoints" double precision`);
    await q.query(`ALTER TABLE "exam_sessions" ADD COLUMN IF NOT EXISTS "maxPoints" double precision`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "exam_sessions" DROP COLUMN IF EXISTS "maxPoints"`);
    await q.query(`ALTER TABLE "exam_sessions" DROP COLUMN IF EXISTS "scorePoints"`);
  }
}
