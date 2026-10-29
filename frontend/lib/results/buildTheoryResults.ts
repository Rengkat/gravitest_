// Turns the server's results breakdown (one row per question, nested parts in
// `structure`, per-part grades in `partScores`) into the per-part shape the
// results UI renders. Pure — no React, no network — so it can be unit tested.
// Every part keeps its OWN grade/feedback/status, keyed by a stable id
// (`${sessionQuestionId}__${path}`), never by array position.

import type { AIResult, SubQuestion } from "@/types/examsTypes";
import type { PartScore, ResultsBreakdownItem } from "@/lib/api/exams";
import { groupTheoryQuestions } from "@/lib/theory/groupTheoryQuestions";

export type QuestionGradeStatus = "graded" | "needs_review" | "ungraded" | "not_attempted";

export interface TheoryPartResult {
  sub: SubQuestion;
  result?: AIResult;
  /** The AI call for THIS part failed — no grade was invented. */
  failed: boolean;
  studentText: string;
  studentImageUrls: string[];
}

export interface TheoryQuestionResult {
  id: string; // sessionQuestionId
  questionId?: string;
  title: string;
  questionText: string;
  marksGot: number;
  marksTotal: number;
  status: QuestionGradeStatus;
  modelAnswer?: string;
  explanation?: string;
  imageUrl?: string;
  parts: TheoryPartResult[];
}

export function questionStatus(item: ResultsBreakdownItem): QuestionGradeStatus {
  const a = item.yourAnswer;
  if (!a) return "not_attempted";
  const hasInput = !!(a.essayText?.trim() || a.essayImageUrls?.length || a.partAnswers?.some((p) => p.essayText?.trim() || p.essayImageUrls?.length));
  if (!hasInput) return "not_attempted";
  if (a.scoringStatus === "pending") return "ungraded";
  if (a.scoringStatus === "needs_review") return "needs_review";
  return "graded";
}

function toResult(part: PartScore, base: Partial<AIResult>): AIResult {
  return {
    id: part.aiEssayScoreId ?? undefined,
    score: part.awardedScore,
    maxScore: part.maxScore,
    feedback: part.feedback,
    strengths: part.strengths ?? [],
    improvements: part.improvements ?? [],
    showSolution: false,
    ...base,
  };
}

export function buildTheoryResults(items: ResultsBreakdownItem[]): TheoryQuestionResult[] {
  return items.map((item, i) => {
    const q = item.question;
    const a = item.yourAnswer;
    const status = questionStatus(item);
    const needsReview = status === "needs_review";
    const explanation = q.explanations?.[0]?.text;

    // Reuse the same grouping the player uses, so labels/paths always match what the server scored.
    const [grouped] = groupTheoryQuestions([
      {
        sessionQuestionId: item.sessionQuestionId,
        id: q.id,
        questionNumber: String(i + 1),
        questionText: q.questionText ?? "",
        questionImageUrl: q.questionImageUrl,
        structure: q.structure ?? null,
        maxScore: q.maxScore ?? undefined,
      } as never,
    ]);

    const parts: TheoryPartResult[] = grouped.subQuestions.map((sub) => {
      const partAnswer = a?.partAnswers?.find((p) => p.path === sub.path);
      const studentText = sub.path === "" ? (a?.essayText ?? "") : (partAnswer?.essayText ?? "");
      const studentImageUrls = sub.path === "" ? (a?.essayImageUrls ?? []) : (partAnswer?.essayImageUrls ?? []);
      const score = a?.partScores?.find((p) => p.path === sub.path);

      if (score) {
        const failed = score.status === "failed";
        return {
          sub,
          failed,
          studentText,
          studentImageUrls,
          result: failed ? undefined : toResult(score, { needsReview }),
        };
      }
      // Plain (non-structured) question: the grade lives on the answer itself.
      if (sub.path === "" && a && a.scoringStatus !== "pending" && a.awardedScore !== null) {
        return {
          sub,
          failed: false,
          studentText,
          studentImageUrls,
          result: {
            id: a.aiEssayScoreId ?? undefined,
            score: a.awardedScore ?? 0,
            maxScore: a.maxScore ?? q.maxScore ?? 0,
            feedback: a.aiFeedback ?? "",
            strengths: a.aiStrengths ?? [],
            improvements: a.aiImprovements ?? [],
            showSolution: false,
            needsReview,
          },
        };
      }
      return { sub, failed: status === "ungraded" && (!!studentText.trim() || studentImageUrls.length > 0), studentText, studentImageUrls };
    });

    const marksTotal = a?.maxScore ?? q.maxScore ?? parts.reduce((sum, p) => sum + (p.sub.marks ?? 0), 0);
    return {
      id: item.sessionQuestionId,
      questionId: q.id,
      title: grouped.title,
      questionText: q.questionText ?? "",
      marksGot: a?.awardedScore ?? 0,
      marksTotal,
      status,
      modelAnswer: q.modelAnswer ?? undefined,
      explanation,
      imageUrl: q.questionImageUrl ?? undefined,
      parts,
    };
  });
}
