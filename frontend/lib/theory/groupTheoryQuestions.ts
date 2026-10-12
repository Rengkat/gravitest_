import type { Question as LegacyTheoryQuestion, SubQuestion } from "@/types/examsTypes";
import type { EssayPart, SessionQuestionDto } from "@/lib/api/exams";

type Heading = { label: string; text?: string };

/**
 * Flattens a nested part tree into its answerable leaves. Only parts with
 * no children get an answer box; parts WITH children are section headings
 * and are carried on each leaf as `headingTrail`. Mirrors the backend's
 * flattenEssayParts, so paths line up with what the server scores.
 */
function flattenParts(
  parts: EssayPart[],
  sessionQuestionId: string,
  parentPath = "",
  trail: Heading[] = [],
): SubQuestion[] {
  const leaves: SubQuestion[] = [];
  for (const part of parts) {
    const path = parentPath ? `${parentPath}.${part.label}` : part.label;
    if (part.children?.length) {
      leaves.push(
        ...flattenParts(part.children, sessionQuestionId, path, [
          ...trail,
          { label: part.label, text: part.text ?? undefined },
        ]),
      );
    } else {
      leaves.push({
        id: `${sessionQuestionId}__${path}`,
        sessionQuestionId,
        path,
        headingTrail: trail,
        label: part.label,
        text: part.text ?? "",
        marks: part.maxScore ?? undefined,
        imageUrl: part.imageUrl ?? undefined,
      });
    }
  }
  return leaves;
}

/**
 * One backend row = one full exam question (e.g. WAEC "Question 1") with
 * every nested part inside its `structure`. So each row becomes one card,
 * and each answerable part inside it becomes its own answer box. Rows with
 * no structure (a plain single-part theory/practical question) get a
 * single answer box, exactly as before.
 */
export function groupTheoryQuestions(dtos: SessionQuestionDto[]): LegacyTheoryQuestion[] {
  return dtos.map((dto, i): LegacyTheoryQuestion => {
    const number = dto.questionNumber || String(i + 1);
    const structured = !!dto.structure?.length;
    const parts = structured ? flattenParts(dto.structure!, dto.sessionQuestionId) : [];
    // A structure that flattens to nothing (all headings) falls back to plain
    const useStructure = parts.length > 0;

    return {
      id: i + 1,
      title: `Question ${number}`,
      imageUrl: dto.questionImageUrl ?? undefined,
      passage: dto.passage ?? null,
      subQuestions: useStructure
        ? parts
        : [
            {
              id: `${dto.sessionQuestionId}__root`,
              sessionQuestionId: dto.sessionQuestionId,
              path: "",
              headingTrail: [],
              label: `${number}.`,
              text: dto.questionText,
              marks: dto.maxScore ?? 10,
            },
          ],
      // Shown under the card title for structured questions (e.g.
      // "Answer all subquestions in Question 1.")
      ...(useStructure && dto.questionText ? { instructions: dto.questionText } : {}),
    };
  });
}
