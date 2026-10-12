export interface QuestionBankStats {
  total: number;
  active: number;
  inactive: number;
  byExamType: Record<string, number>;
  // Only counts questions with an explicit candidateType set — untagged
  // (null = "applies to both") questions aren't included in either
  // bucket here, since they're not really "school" or "private" counts.
  byCandidateType: Record<string, number>;
  bySubject: Record<string, number>;
  byDifficulty: Record<string, number>;
  byType: Record<string, number>;
  byYear: Record<number, number>;
  withExplanations: number;
  withImages: number;
}
