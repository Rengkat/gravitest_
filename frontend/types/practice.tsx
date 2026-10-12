export type ExamCategory = "SECONDARY" | "PROFESSIONAL";
export type ExamType =
  | "JAMB"
  | "WAEC"
  | "NECO"
  | "NABTEB"
  | "BECE"
  | "JUNIOR_NECO"
  | "PROFESSIONAL";
export type QuestionType = "MCQ" | "THEORY" | "PRACTICAL" | "ALL";
export type ProfessionalExam = "ICAN" | "NMCN" | "CIPM" | "NIM" | "NIESV";

// School (internal) vs private (external) candidate — only WAEC, NECO,
// NABTEB, BECE and Junior NECO actually register candidates this way.
export type CandidateType = "SCHOOL" | "PRIVATE";
export const CANDIDATE_TYPE_EXAMS: ExamType[] = ["WAEC", "NECO", "NABTEB", "BECE", "JUNIOR_NECO"];

export interface PracticeConfig {
  examType: ExamType | null;
  // Only meaningful when examType is in CANDIDATE_TYPE_EXAMS. Undefined
  // = both streams included in question selection.
  candidateType?: CandidateType;
  professionalExam?: ProfessionalExam;
  year?: string;
  subject?: string; // single subject (non-JAMB)
  subjects?: string[]; // multi-subject (JAMB)
  questionType?: QuestionType;
  numQuestions?: number; // MCQ count (or the only count, for single-type sessions)
  numTheoryQuestions?: number; // Mixed sessions only: how many theory questions
  timeLimit?: number;
}
