import { Answer, Question } from "@/lib/constants/mcq";

export function buildInitialAnswers(questions: Question[]): Answer[] {
  return questions.map((q, i) => ({
    questionId: q.id,
    selectedOption: null,
    isFlagged: false,
    isVisited: i === 0,
  }));
}
