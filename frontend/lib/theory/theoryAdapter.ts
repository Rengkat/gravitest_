import type { Question as UiQuestion, SubQuestion } from "@/types/examsTypes";
import type { SessionQuestionDto } from "@/lib/api/exams";

/**
 * The existing UI models a WAEC-style essay question as one parent
 * ("Question 1") with lettered sub-parts (1a, 1b, 1c), each independently
 * marked. The backend models each sub-part as its own Question row with
 * `questionNumber` like "1a" — this groups them back by the leading
 * digit(s) of questionNumber. A question with no questionNumber (or a
 * plain number, no letter) becomes its own single-part group.
 */
export function adaptToTheoryQuestions(questions: SessionQuestionDto[]): UiQuestion[] {
  const groups = new Map<string, SessionQuestionDto[]>();

  for (const q of questions) {
    const num = q.questionNumber ?? q.id;
    const groupKey = num.match(/^\d+/)?.[0] ?? num;
    (groups.get(groupKey) ?? groups.set(groupKey, []).get(groupKey)!).push(q);
  }

  return Array.from(groups.entries()).map(([groupKey, dtos], i) => {
    const first = dtos[0];
    const subQuestions: SubQuestion[] = dtos.map((dto) => ({
      id: dto.sessionQuestionId,
      label: dto.questionNumber ?? `${i + 1}`,
      text: dto.questionText,
      marks: dto.maxScore ?? 10,
      imageUrl: dto.questionImageUrl ?? undefined,
    }));

    return {
      id: Number(groupKey.replace(/\D/g, "")) || i + 1,
      title: dtos.length > 1 ? `Question ${groupKey}` : first.questionText,
      imageUrl: dtos.length === 1 ? (first.questionImageUrl ?? undefined) : undefined,
      subQuestions,
    };
  });
}
