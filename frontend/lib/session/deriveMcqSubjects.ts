// Place at: lib/session/deriveMcqSubjects.ts
//
// Single source of truth for turning a PracticeConfig into the list of
// subjects + question counts the MCQ player runs through. Used by both
// cbt/mcq/[id]/page.tsx (to render the exam) and the results page (to
// re-derive the same questions so answers can be checked/displayed).
// Keeping this in one place means the results page can never drift out of
// sync with what the player actually showed the student.

import { PracticeConfig } from "@/types/practice";

export type McqSubject = {
  id: string;
  name: string;
  questionCount: number;
};

export const FALLBACK_MCQ_SUBJECTS: McqSubject[] = [
  { id: "english", name: "English", questionCount: 5 },
  { id: "chemistry", name: "Chemistry", questionCount: 5 },
  { id: "mathematics", name: "Mathematics", questionCount: 6 },
  { id: "physics", name: "Physics", questionCount: 3 },
];

export function deriveMcqSubjects(config?: PracticeConfig | null): McqSubject[] {
  if (!config) return FALLBACK_MCQ_SUBJECTS;
  const total = config.numQuestions || 40;
  if (config.subjects?.length) {
    const per = Math.max(1, Math.round(total / config.subjects.length));
    return config.subjects.map((s) => ({ id: s, name: s, questionCount: per }));
  }
  if (config.subject) {
    return [{ id: config.subject, name: config.subject, questionCount: total }];
  }
  return FALLBACK_MCQ_SUBJECTS;
}
