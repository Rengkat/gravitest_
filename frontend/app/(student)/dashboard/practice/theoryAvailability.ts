// Place at: lib/practice/theoryAvailability.ts
//
// Some exam categories / subjects are MCQ-only (e.g. JAMB, most professional exams,
// and subjects like "English" past-question banks that this app only stocks as MCQ).
// This file is the single place that knows which (examType, subject) pairs have
// theory/practical questions available, so the Practice selection screen can disable
// the Theory / Practical / Mixed options instead of letting a user configure a
// session that has nothing to show on /cbt/theory.
//
// ⚠️ Wire this up to your real question bank. The map below is a starting point —
// replace it with a lookup against your actual data (DB, constants file, or an API
// call) once you know which subjects truly have theory content.

import { ExamCategory } from "@/types/practice";

/**
 * Subjects (or professional exam ids) that do NOT have theory/practical questions.
 * Everything not listed here is assumed to support theory.
 */
const NO_THEORY_SUBJECTS = new Set<string>([
  "English Language", // adjust to match your real subject names
]);

/** Exam categories that are MCQ-only altogether (e.g. JAMB is always objective). */
const MCQ_ONLY_CATEGORIES = new Set<string>(["JAMB"]);

export function hasTheorySupport(params: {
  examType?: ExamCategory | string | null;
  subject?: string | null;
  professionalExam?: string | null;
}): boolean {
  const { examType, subject, professionalExam } = params;

  if (examType && MCQ_ONLY_CATEGORIES.has(examType)) return false;

  const id = subject ?? professionalExam;
  if (!id) return true; // unknown — don't block the UI, let the question bank decide later

  return !NO_THEORY_SUBJECTS.has(id);
}
