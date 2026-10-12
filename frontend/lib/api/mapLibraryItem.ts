import type { LibraryItem, ContentType, Subject, Level, ExamType } from "@/types/library";
import type { LibraryContentDto } from "@/lib/api/library";

const CONTENT_TYPE_MAP: Record<LibraryContentDto["contentType"], ContentType> = {
  ebook: "ebooks",
  video: "videos",
  image: "images",
  document: "documents",
  audio: "videos", // no dedicated audio tab yet on this page — grouped with videos
  quiz: "documents",
  past_question: "documents",
  practice_set: "documents",
};

const KNOWN_SUBJECTS = new Set<Subject>([
  "mathematics", "english", "physics", "chemistry", "biology", "economics", "government", "literature",
]);

function mapSubject(subject: string | null): Subject {
  if (subject && KNOWN_SUBJECTS.has(subject as Subject)) return subject as Subject;
  return "all";
}

function mapExamType(examTypes: string[]): ExamType {
  const known: ExamType[] = ["jamb", "waec", "neco", "nabteb"];
  const match = examTypes.find((e) => known.includes(e as ExamType));
  if (match) return match as ExamType;
  if (examTypes.some((e) => ["ican", "nmcn", "cipm", "nim", "niesv"].includes(e))) return "professional";
  return "all";
}

function mapLevel(classLevels: string[]): Level {
  if (classLevels.includes("ss3")) return "sss3";
  if (classLevels.includes("ss2")) return "sss2";
  if (classLevels.includes("ss1")) return "sss1";
  return "all";
}

export function mapLibraryContentToLibraryItem(dto: LibraryContentDto): LibraryItem {
  return {
    id: dto.id,
    type: CONTENT_TYPE_MAP[dto.contentType] ?? "documents",
    title: dto.title,
    description: dto.description ?? "",
    subject: mapSubject(dto.subject),
    level: mapLevel(dto.classLevels),
    examType: mapExamType(dto.examTypes),
    duration: dto.durationSeconds ? formatDuration(dto.durationSeconds) : undefined,
    pages: dto.totalPages ?? undefined,
    size: dto.fileSizeBytes ? `${(dto.fileSizeBytes / 1024 / 1024).toFixed(1)} MB` : undefined,
    author: dto.author ?? "Gravitest",
    views: dto.totalViews,
    likes: 0,
    downloads: dto.totalDownloads,
    rating: dto.averageRating,
    ratingCount: dto.totalRatings,
    isPremium: !dto.isFree,
    // Locked = this student can't open it yet. Older servers don't send hasAccess,
    // in which case every non-free item stays locked (the previous behaviour).
    isLocked: dto.hasAccess === undefined ? !dto.isFree : !dto.hasAccess,
    accessModel: dto.accessModel ?? (dto.isFree ? "free" : dto.requiredTier ? "subscription" : "purchase"),
    price: dto.priceKobo ? dto.priceKobo / 100 : undefined,
    isNew: isWithinDays(dto.createdAt, 14),
    isTrending: false,
    isFeatured: false,
    dateAdded: dto.createdAt,
    tags: dto.topic ? [dto.topic] : [],
    previewAvailable: !dto.isFree,
    thumbnailUrl: dto.thumbnailUrl ?? undefined,
  };
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function isWithinDays(iso: string, days: number): boolean {
  return Date.now() - new Date(iso).getTime() < days * 24 * 60 * 60 * 1000;
}
