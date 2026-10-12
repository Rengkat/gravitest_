// Builds the text shown on the CBT "Instructions" screens (MCQ + theory)
// from the real practice session, so nothing there is hardcoded.
//
// Duration comes from the SAME value that drives the on-screen timer
// (config.timeLimit, in minutes, default 120) so the instructions can
// never disagree with the countdown.

import { SECONDARY_EXAMS, PROFESSIONAL_EXAMS } from "@/lib/constants/practice";
import type { PracticeSession, CbtPart } from "./practiceSession";

export const DEFAULT_DURATION_MINUTES = 120;

export interface ExamSummary {
  /** "Secondary School Exam" | "Professional Exam" — null when unknown */
  categoryLabel: string | null;
  /** e.g. "JAMB UTME CBT Examination" */
  title: string;
  /** e.g. "Physics, Chemistry" — null when unknown */
  subjectsLabel: string | null;
  /** Number of questions in THIS part — null when unknown */
  questionCount: number | null;
  /** Timer length in minutes — null when unknown */
  durationMinutes: number | null;
}

export const EMPTY_EXAM_SUMMARY: ExamSummary = {
  categoryLabel: null,
  title: "CBT Examination",
  subjectsLabel: null,
  questionCount: null,
  durationMinutes: null,
};

/** Single source of truth for the timer length (minutes). */
export function getSessionDurationMinutes(session: PracticeSession | null | undefined): number {
  return session?.config.timeLimit ?? DEFAULT_DURATION_MINUTES;
}

export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "Hour" : "Hours"}`);
  if (mins > 0 || hours === 0) parts.push(`${mins} ${mins === 1 ? "Min" : "Mins"}`);
  return parts.join(" ");
}

export function formatQuestionCount(count: number): string {
  return `${count} ${count === 1 ? "Question" : "Questions"}`;
}

function titleCase(raw: string): string {
  const cleaned = raw.replace(/[_-]+/g, " ").trim();
  // Only re-case ids like "PHYSICS" / "further_mathematics"; leave labels
  // that are already mixed-case ("Use of English") alone.
  if (cleaned !== cleaned.toLowerCase() && cleaned !== cleaned.toUpperCase()) return cleaned;
  return cleaned.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function examLabel(session: PracticeSession): string | null {
  const { examType, professionalExam } = session.config;
  if (!examType) return null;
  if (examType === "PROFESSIONAL") {
    return PROFESSIONAL_EXAMS.find((e) => e.id === professionalExam)?.name ?? professionalExam ?? "Professional";
  }
  const exam = SECONDARY_EXAMS.find((e) => e.id === examType);
  return exam ? `${exam.name} ${exam.fullName}` : examType;
}

/**
 * @param part           which CBT part this Instructions screen belongs to
 * @param questionCount  number of questions in this part (the caller already
 *                       has it; for theory this is the grouped-essay count)
 */
export function buildExamSummary(
  session: PracticeSession | null | undefined,
  part: CbtPart,
  questionCount: number,
): ExamSummary {
  if (!session) return EMPTY_EXAM_SUMMARY;

  const label = examLabel(session);
  const partQuestions = session.questions.filter((q) => q.type === part);
  const subjectIds = Array.from(new Set(partQuestions.map((q) => q.subject).filter(Boolean)));
  const subjects = subjectIds.length
    ? subjectIds
    : (session.config.subjects?.length
        ? session.config.subjects
        : session.config.subject
          ? [session.config.subject]
          : []);

  return {
    categoryLabel:
      session.config.examType === "PROFESSIONAL"
        ? "Professional Exam"
        : session.config.examType
          ? "Secondary School Exam"
          : null,
    title: label ? `${label} CBT Examination` : "CBT Examination",
    subjectsLabel: subjects.length ? subjects.map(titleCase).join(", ") : null,
    questionCount: questionCount > 0 ? questionCount : null,
    durationMinutes: getSessionDurationMinutes(session),
  };
}
