import type { ContentType as FrontendContentType, SubjectCategory } from "@/types/admin-contents";

// Backend enums (src/common/enums/enums.ts) — kept in sync manually since
// the frontend doesn't share a package with the NestJS API.
export type BackendContentType =
  | "ebook"
  | "video"
  | "image"
  | "document"
  | "audio"
  | "quiz"
  | "past_question"
  | "practice_set";

// Frontend has two content types ("interactive", "flashcard") the backend
// doesn't model yet — they fall back to "document" until the backend
// LibraryContent.contentType enum is extended for them.
const CONTENT_TYPE_MAP: Record<FrontendContentType, BackendContentType> = {
  ebook: "ebook",
  video: "video",
  image: "image",
  document: "document",
  audio: "audio",
  quiz: "quiz",
  interactive: "document",
  flashcard: "document",
};

export function toBackendContentType(type: FrontendContentType): BackendContentType {
  return CONTENT_TYPE_MAP[type] ?? "document";
}

// Direct 1:1 matches only. The frontend's four professional-track
// buckets ("nursing", "hr_management", "management", "estate") don't
// have a single corresponding backend Subject value — the backend
// models those exams' subjects far more granularly (e.g. NMCN has
// ANATOMY, PHYSIOLOGY, NURSING_FUNDAMENTALS... instead of one generic
// "nursing"). Rather than guess wrong and fail @IsEnum validation, we
// omit `subject` for those and rely on `examTypes` + `topic` (free
// text) for filtering — see buildLibraryCreatePayload below.
const SUBJECT_MAP: Partial<Record<SubjectCategory, string>> = {
  mathematics: "mathematics",
  english: "english",
  physics: "physics",
  chemistry: "chemistry",
  biology: "biology",
  economics: "economics",
  government: "government",
  literature: "literature_in_english",
  commerce: "commerce",
  geography: "geography",
  accounting: "accounting",
};

export function toBackendSubject(subject: SubjectCategory): string | undefined {
  return SUBJECT_MAP[subject];
}

// Exam codes are identical strings on both sides (jamb/waec/neco/nabteb/
// bece/junior_neco/ican/nmcn/cipm/nim/niesv) so no mapping table needed —
// just pass the value through, and drop "all".
export function toBackendExamTypes(examTarget: string): string[] {
  return examTarget && examTarget !== "all" ? [examTarget] : [];
}
