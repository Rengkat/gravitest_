/**
 * How a session's score is worked out — ONE definition, used when a session is submitted, when a failed
 * essay is regraded later, and when old sessions are recalculated.
 *
 * Marks-based, so a student is credited for what they actually earned:
 *   - an objective question (MCQ, true/false, fill-in…) is worth 1 point: 1 if right, else 0;
 *   - a theory / practical question is worth its marks: the student earns the marks they were awarded.
 * Overall score = points earned ÷ points available. A session with only a theory question scored 2/6 is
 * therefore 33% — it used to be 0%, because a theory answer only counted if it reached a 50% pass mark
 * and then counted as a whole "correct question" (all-or-nothing).
 *
 * `questionsCorrect` (the count of questions answered well enough) is still produced, with the same 50%
 * pass rule as before, because streaks, XP and per-topic stats are built on it.
 */

export const ESSAY_PASS_RATIO = 0.5;
export const DEFAULT_ESSAY_MAX = 10;

export interface ScoreInput {
  subject: string;
  topic: string;
  isEssay: boolean;
  /** The student saved an answer for this question. */
  answered: boolean;
  /** Objective questions: was the answer right. */
  isCorrect: boolean;
  /** Essays: marks awarded so far (null while pending / not graded). */
  awardedScore: number | null;
  /** Essays: max marks recorded on the graded answer, if any. */
  answerMaxScore: number | null;
  /** Essays: max marks defined on the question itself. */
  questionMaxScore: number | null;
}

export interface Bucket {
  /** Questions in this subject/topic. */
  total: number;
  attempted: number;
  /** Questions answered well enough to count as correct. */
  correct: number;
  points: number;
  maxPoints: number;
}

export interface SessionTally {
  points: number;
  maxPoints: number;
  questionsAttempted: number;
  questionsCorrect: number;
  subjects: Map<string, Bucket>;
  topics: Map<string, Bucket>;
}

const finitePositive = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Marks available for an essay question. The graded answer's own max wins, then the question's, then the default. */
export function essayMaxMarks(input: Pick<ScoreInput, 'answerMaxScore' | 'questionMaxScore'>): number {
  if (finitePositive(input.answerMaxScore)) return input.answerMaxScore;
  if (finitePositive(input.questionMaxScore)) return input.questionMaxScore;
  return DEFAULT_ESSAY_MAX;
}

/** Points earned (and available) for one question. */
export function questionPoints(input: ScoreInput): { earned: number; max: number; passed: boolean } {
  if (!input.isEssay) {
    const earned = input.answered && input.isCorrect ? 1 : 0;
    return { earned, max: 1, passed: earned === 1 };
  }
  const max = essayMaxMarks(input);
  const awarded = Number(input.awardedScore);
  const earned =
    input.answered && Number.isFinite(awarded) ? Math.min(max, Math.max(0, awarded)) : 0;
  return { earned, max, passed: earned / max >= ESSAY_PASS_RATIO };
}

export function tallySession(inputs: ScoreInput[]): SessionTally {
  const tally: SessionTally = {
    points: 0,
    maxPoints: 0,
    questionsAttempted: 0,
    questionsCorrect: 0,
    subjects: new Map(),
    topics: new Map(),
  };
  const bucket = (map: Map<string, Bucket>, key: string) => {
    let b = map.get(key);
    if (!b) {
      b = { total: 0, attempted: 0, correct: 0, points: 0, maxPoints: 0 };
      map.set(key, b);
    }
    return b;
  };

  for (const input of inputs) {
    const { earned, max, passed } = questionPoints(input);
    const targets = [bucket(tally.subjects, input.subject), bucket(tally.topics, input.topic)];
    for (const b of targets) {
      b.total += 1;
      b.maxPoints += max;
      b.points += earned;
      if (input.answered) b.attempted += 1;
      if (input.answered && passed) b.correct += 1;
    }
    tally.maxPoints += max;
    tally.points += earned;
    if (input.answered) {
      tally.questionsAttempted += 1;
      if (passed) tally.questionsCorrect += 1;
    }
  }
  return tally;
}

/** 0–100, one decimal place of precision kept. */
export function percentOf(points: number, maxPoints: number): number {
  return maxPoints > 0 ? round2((points / maxPoints) * 100) : 0;
}

/** Shapes a tally into the JSON stored on the session (subject and topic breakdowns). */
export function toBreakdowns(tally: SessionTally) {
  return {
    subjectScores: Array.from(tally.subjects.entries()).map(([subject, b]) => ({
      subject,
      score: b.correct, // questions answered well enough (unchanged meaning)
      total: b.total,
      percentage: Math.round(percentOf(b.points, b.maxPoints)), // now marks-based
      points: round2(b.points),
      maxPoints: round2(b.maxPoints),
    })),
    topicBreakdown: Array.from(tally.topics.entries()).map(([topic, b]) => ({
      topic,
      total: b.total,
      correct: b.correct,
      score: Math.round(percentOf(b.points, b.maxPoints)),
      points: round2(b.points),
      maxPoints: round2(b.maxPoints),
    })),
  };
}
