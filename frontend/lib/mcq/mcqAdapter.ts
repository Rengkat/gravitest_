import type { Question } from "@/lib/constants/mcq";
import type { SessionQuestionDto } from "@/lib/api/exams";

/**
 * Real MCQ questions never include the correct answer up front (the
 * backend withholds it until practice-mode reveal or results — see
 * ExamsService.sanitizeQuestion). `revealedCorrectAnswer` (a letter, e.g.
 * "B") comes from POST /answers' response in practice mode; leave it
 * undefined for exam/mock mode or before the question's been answered.
 *
 * Both sides already speak in plain option letters (A/B/C/D) — no
 * text-based mapping needed, selectedLabel passes straight through.
 */
export function adaptToMcqQuestion(
  dto: SessionQuestionDto,
  index: number,
  revealedCorrectAnswer?: string,
  revealedExplanation?: string,
): Question {
  const options = (dto.options ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((o) => ({ label: o.label, text: o.text, imageUrl: o.imageUrl }));

  return {
    id: index,
    text: dto.questionText,
    options,
    correctAnswer: revealedCorrectAnswer ?? "",
    // The stored (database) explanation — only ever present once revealed.
    explanation: revealedExplanation,
    subjectId: dto.subject,
    sessionQuestionId: dto.sessionQuestionId,
    questionId: dto.id,
    questionImageUrl: dto.questionImageUrl,
    hasDiagram: !!dto.questionImageUrl,
    passage: dto.passage ?? null,
  };
}
