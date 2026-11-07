import { ExamMode, QuestionType, SessionStatus } from 'src/common/enums/enums';
import { EssayScoringStatus } from 'src/students/entities/student-answers.entity';
import { getDeadlineMs, SUBMIT_GRACE_SECONDS } from 'src/exams/utils/exam-timing.util';

/**
 * The single definition of WHEN a student may see a question's discussion.
 * Pure and dependency-free so the integrity rules can be unit-tested
 * exhaustively — this is the security boundary, not the UI.
 */

const ESSAY_TYPES = new Set<QuestionType>([QuestionType.THEORY, QuestionType.PRACTICAL]);
const FINISHED = new Set<SessionStatus>([
  SessionStatus.SUBMITTED,
  SessionStatus.TIMED_OUT,
  SessionStatus.COMPLETED,
]);

export interface AttemptFacts {
  mode: ExamMode;
  sessionStatus: SessionStatus;
  questionType: QuestionType;
  /** The student has saved an answer for this question in this session. */
  hasAnswer: boolean;
  scoringStatus: EssayScoringStatus | null;
  partScores: { path: string; status?: string }[] | null;
  /** Label-path of the part the thread belongs to, or null for a whole-question thread. */
  partPath: string | null;
}

/**
 * Has the correction for this attempt been released to the student?
 *
 *  - Practice, in progress: after the student attempts it. MCQ → as soon as
 *    the answer is saved (that is when the correct answer is revealed).
 *    Theory/practical → once that part (or question) has actually been
 *    graded — never before.
 *  - Any session that has finished (submitted or timed out): the full
 *    results are visible, so discussions are too — but for essay questions
 *    only once grading has completed.
 *  - Exam (mock) mode in progress: never.
 */
export function isCorrectionReleased(a: AttemptFacts): boolean {
  const isEssay = ESSAY_TYPES.has(a.questionType);

  if (FINISHED.has(a.sessionStatus)) {
    if (!isEssay) return true;
    if (!a.hasAnswer) return true; // nothing to grade; correction is part of the released results
    return a.scoringStatus !== EssayScoringStatus.PENDING;
  }

  if (a.sessionStatus === SessionStatus.IN_PROGRESS && a.mode === ExamMode.PRACTICE) {
    if (!a.hasAnswer) return false;
    if (!isEssay) return true;
    if (a.partPath) {
      return !!a.partScores?.some((p) => p.path === a.partPath && p.status !== 'failed');
    }
    return (
      a.scoringStatus === EssayScoringStatus.SCORED ||
      a.scoringStatus === EssayScoringStatus.NEEDS_REVIEW
    );
  }

  return false;
}

/** Long-abandoned untimed exams must not block discussions forever. */
export const UNTIMED_ACTIVE_WINDOW_HOURS = 12;

/**
 * Is this session an exam the student is, right now, expected to be sitting?
 * While one is, the discussion API is closed to them entirely — even for
 * questions they previously unlocked — so it can't be used to look answers up.
 */
export function isActiveExam(
  s: { mode: ExamMode; status: SessionStatus; startedAt: Date; allowedDurationSeconds: number | null },
  nowMs: number,
): boolean {
  if (s.mode !== ExamMode.MOCK || s.status !== SessionStatus.IN_PROGRESS) return false;
  const deadline = getDeadlineMs(s);
  if (deadline !== null) return nowMs <= deadline + SUBMIT_GRACE_SECONDS * 1000;
  return nowMs - new Date(s.startedAt).getTime() < UNTIMED_ACTIVE_WINDOW_HOURS * 3600_000;
}
