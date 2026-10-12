// The complete-registration form uses UI-friendly labels/ids for states,
// exam types, and subjects. The backend's Postgres enums use different
// casing/spelling in a handful of cases. Centralizing the mismatches here
// so the form components themselves can keep using nice display values.

// NigerianState enum matches these 1:1 except the capital.
const STATE_OVERRIDES: Record<string, string> = {
  "FCT Abuja": "Federal Capital Territory",
};

export function toBackendState(uiState: string): string {
  return STATE_OVERRIDES[uiState] ?? uiState;
}

// ExamType enum uses snake_case; only "post-utme" needs translating.
const EXAM_TYPE_OVERRIDES: Record<string, string> = {
  "post-utme": "post_utme",
};

export function toBackendExamType(uiId: string): string {
  return EXAM_TYPE_OVERRIDES[uiId] ?? uiId;
}

export function toBackendExamTypes(uiIds: string[]): string[] {
  return uiIds.map(toBackendExamType);
}

// Subject enum uses lowercase snake_case; UI shows Title Case labels
// (sometimes with "&" or multi-word names), so every entry needs mapping.
const SUBJECT_MAP: Record<string, string> = {
  "Mathematics": "mathematics",
  "English Language": "english",
  "Physics": "physics",
  "Chemistry": "chemistry",
  "Biology": "biology",
  "Economics": "economics",
  "Government": "government",
  "Literature in English": "literature_in_english",
  "History": "history",
  "Geography": "geography",
  "Commerce": "commerce",
  "Accounting": "accounting",
  "Further Mathematics": "further_mathematics",
  "Civic Education": "civic_education",
  "Christian Religious Studies": "christian_religious_studies",
  "Islamic Religious Studies": "islamic_religious_studies",
  "Agricultural Science": "agricultural_science",
  "Computer Science": "computer_science",
  "Technical Drawing": "technical_drawing",
  "Food & Nutrition": "food_and_nutrition",
  "French": "french",
  "Yoruba": "yoruba",
  "Hausa": "hausa",
  "Igbo": "igbo",
};

export function toBackendSubject(uiLabel: string): string {
  return SUBJECT_MAP[uiLabel] ?? uiLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

export function toBackendSubjects(uiLabels: string[]): string[] {
  return uiLabels.map(toBackendSubject);
}
