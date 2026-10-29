// Builds the text shown on the CBT "Instructions" screens (MCQ + theory)
// from the real session, so nothing there is hardcoded.
//
// SINGLE SOURCE OF TRUTH: the backend session created from the student's
// configuration (mode, allowedDurationSeconds, loaded questions). The timer, the
// submission rules and the results page read the same session, so the
// instructions can never disagree with them. There is deliberately NO default
// duration here: an Exam without a duration is reported as invalid instead of
// silently showing a made-up "2 hours".

import { SECONDARY_EXAMS, PROFESSIONAL_EXAMS } from "@/lib/constants/practice";
import type { PracticeSession, CbtPart } from "./practiceSession";

export type AssessmentKind = "mcq" | "theory" | "practical";

export interface ExamSummary {
  /** "Secondary School Exam" | "Professional Exam" — null when unknown */
  categoryLabel: string | null;
  /** e.g. "JAMB UTME CBT Examination" */
  title: string;
  /** e.g. "Physics, Chemistry" — null when unknown */
  subjectsLabel: string | null;
  /** Number of questions in THIS part — null when unknown */
  questionCount: number | null;
  /** Timer length in minutes. null = untimed (Practice) or unknown. */
  durationMinutes: number | null;
  mode: "practice" | "exam";
  modeLabel: string;
  kind: AssessmentKind;
  kindLabel: string;
  /** Practice = false. Exam = true. */
  isTimed: boolean;
}

export const EMPTY_EXAM_SUMMARY: ExamSummary = {
  categoryLabel: null,
  title: "CBT Examination",
  subjectsLabel: null,
  questionCount: null,
  durationMinutes: null,
  mode: "practice",
  modeLabel: "Practice Mode",
  kind: "mcq",
  kindLabel: "Multiple choice (MCQ)",
  isTimed: false,
};

/**
 * Timer length in minutes for an EXAM session, from the backend session — the
 * same value the server enforces. null for Practice (untimed) and when missing.
 */
export function getSessionDurationMinutes(session: PracticeSession | null | undefined): number | null {
  if (!session || session.mode !== "exam") return null;
  const seconds = session.backendSession?.allowedDurationSeconds;
  return seconds && seconds > 0 ? Math.round(seconds / 60) : null;
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

const KIND_LABELS: Record<AssessmentKind, string> = {
  mcq: "Multiple choice (MCQ)",
  theory: "Theory",
  practical: "Practical",
};

function kindOf(session: PracticeSession, part: CbtPart): AssessmentKind {
  if (part === "mcq") return "mcq";
  const partQuestions = session.questions.filter((q) => q.type === "theory" || q.type === "practical");
  if (partQuestions.length && partQuestions.every((q) => q.type === "practical")) return "practical";
  if (!partQuestions.length && session.config.questionType === "PRACTICAL") return "practical";
  return "theory";
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
  const partQuestions = session.questions.filter((q) =>
    part === "mcq" ? q.type === "mcq" : q.type === "theory" || q.type === "practical",
  );
  const subjectIds = Array.from(new Set(partQuestions.map((q) => q.subject).filter(Boolean)));
  const subjects = subjectIds.length
    ? subjectIds
    : session.config.subjects?.length
      ? session.config.subjects
      : session.config.subject
        ? [session.config.subject]
        : [];
  const kind = kindOf(session, part);

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
    mode: session.mode,
    modeLabel: session.mode === "exam" ? "Exam Mode" : "Practice Mode",
    kind,
    kindLabel: KIND_LABELS[kind],
    isTimed: session.mode === "exam",
  };
}

/**
 * Returns a human-readable problem when the session cannot be started
 * honestly (missing / unloadable / inconsistent configuration), else null.
 * The player shows this explicitly instead of silently using defaults.
 */
export function validateSessionForPlay(
  session: PracticeSession | null | undefined,
  part: CbtPart,
): string | null {
  if (!session) {
    return "We couldn't load this session on this device. Start a new session from the practice page.";
  }
  const partQuestions = session.questions.filter((q) =>
    part === "mcq" ? q.type === "mcq" : q.type === "theory" || q.type === "practical",
  );
  if (partQuestions.length === 0) {
    return "This session has no questions for this section.";
  }
  if (session.backendSession?.status && session.backendSession.status !== "in_progress") {
    return "This session has already been submitted.";
  }
  if (session.mode === "exam" && getSessionDurationMinutes(session) === null) {
    return "This exam has no valid duration, so it can't be started. Please create a new session and choose a time limit.";
  }
  return null;
}

export interface InstructionLine {
  /** Segments so the UI can bold key facts without parsing markup. */
  segments: { text: string; bold?: boolean }[];
  warning?: boolean;
}

const t = (text: string, bold = false) => ({ text, bold });

/** Instruction lines for a session — every number/word comes from the summary. */
export function buildInstructionLines(summary: ExamSummary): InstructionLine[] {
  const count = summary.questionCount;
  const countText = count ? formatQuestionCount(count).toLowerCase() : "questions";
  const subject = summary.subjectsLabel ?? "your selected subject";
  const duration = summary.durationMinutes;
  const isMcq = summary.kind === "mcq";
  const lines: InstructionLine[] = [];

  if (summary.mode === "practice") {
    lines.push({
      segments: [
        t("This is a "), t("Practice", true), t(` session with ${countText} in `), t(subject, true),
        t(". It is "), t("untimed", true), t(" — take as long as you need."),
      ],
    });
    lines.push({
      segments: isMcq
        ? [
            t("Choose an option, then press "), t("Check Answer", true),
            t(" to get immediate feedback. If you are wrong, the correct answer and the explanation appear straight away; if you are right, you get a confirmation and the explanation."),
          ]
        : [
            t("Write your answer to a part, then press "), t("Check Answer", true),
            t(" under that part to get feedback on it alone — you don't need to submit the whole paper."),
          ],
    });
    lines.push({
      segments: [
        t("Under each explanation, use "), t("Explain more with AI", true),
        t(" to get a simpler or a more detailed explanation of that question."),
      ],
    });
    lines.push({ segments: [t("Practice is for learning: "), t("no formal score", true), t(" is calculated.")] });
  } else {
    lines.push({
      segments: [
        t("This "), t(summary.kindLabel, true), t(` exam has ${countText} in `), t(subject, true),
        t(" and must be completed in "),
        t(duration ? formatDuration(duration) : "the allotted time", true), t("."),
      ],
    });
    lines.push({
      segments: [
        t("Correct answers, explanations, feedback and your score are "), t("revealed only after you submit", true),
        t(" — or after the exam is submitted automatically when time runs out."),
      ],
    });
    lines.push({
      segments: [t("Your answers are saved as you go and you can change them until you submit.")],
    });
  }

  if (isMcq) {
    lines.push({
      segments: [
        t("Use the "), t("Question Navigator", true), t(" to jump between questions; press "),
        t("A, B, C or D", true), t(" to choose an option, "), t("F", true), t(" to flag a question and "),
        t("← →", true), t(" to move between questions."),
      ],
    });
  } else {
    lines.push({
      segments: [
        t("Each question has parts (a, b, c…). You can "), t("type", true), t(", use the "),
        t("whiteboard", true), t(", "), t("graph sheet", true), t(", "), t("construction sheet", true),
        t(", or "), t("upload", true), t(" an image of your work."),
      ],
    });
  }

  if (summary.mode === "exam") {
    lines.push({
      warning: true,
      segments: [
        t("The exam "), t("auto-submits when the timer reaches zero", true),
        t(". The timer is kept by the server, so refreshing the page does not reset it."),
      ],
    });
  }
  return lines;
}
