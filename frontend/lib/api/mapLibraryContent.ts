import type { ContentItem, ContentType, SubjectCategory, ExamTarget } from "@/types/admin-contents";
import type { LibraryContentDto } from "@/lib/api/library";

const CONTENT_TYPE_REVERSE: Record<LibraryContentDto["contentType"], ContentType> = {
  ebook: "ebook",
  video: "video",
  image: "image",
  document: "document",
  audio: "audio",
  quiz: "quiz",
  past_question: "document",
  practice_set: "quiz",
};

const EXAM_LABELS: Record<string, string> = {
  jamb: "JAMB",
  waec: "WAEC",
  neco: "NECO",
  nabteb: "NABTEB",
  bece: "BECE",
  junior_neco: "Jr. NECO",
  ican: "ICAN",
  nmcn: "NMCN",
  cipm: "CIPM",
  nim: "NIM",
  niesv: "NIESV",
};

const PROFESSIONAL_EXAMS = new Set(["ican", "nmcn", "cipm", "nim", "niesv"]);

/**
 * Adapts a real backend LibraryContent record into the richer ContentItem
 * shape the admin content UI was built against. Fields the backend
 * doesn't track yet (likes, revenue, quality tier, featured/trending/
 * verified flags, completion/conversion/bounce rates) default to 0/false
 * — they render correctly, they're just not live analytics yet. See
 * NOTES.md for what a backend extension would need to light these up.
 */
export function mapLibraryContentToContentItem(dto: LibraryContentDto): ContentItem {
  const examTarget = (dto.examTypes[0] ?? "all") as ExamTarget;
  return {
    id: dto.id,
    type: CONTENT_TYPE_REVERSE[dto.contentType] ?? "document",
    title: dto.title,
    description: dto.description ?? "",
    subject: (dto.subject ?? "all") as SubjectCategory,
    audience: PROFESSIONAL_EXAMS.has(examTarget) ? "professional" : "secondary",
    examTarget,
    examLabel: EXAM_LABELS[examTarget] ?? "All",
    size: dto.fileSizeBytes ? `${(dto.fileSizeBytes / 1024 / 1024).toFixed(1)} MB` : "—",
    pages: dto.totalPages ?? undefined,
    duration: dto.durationSeconds ? formatDuration(dto.durationSeconds) : undefined,
    author: dto.author ?? "Gravitest",
    uploaderName: dto.author ?? "Gravitest",
    // Was: dto.isFree ? "free" : dto.requiredTier === "enterprise" ? "enterprise" : "premium"
    // — collapsed basic/standard-gated content into "premium" in the
    // admin UI, since those two tiers weren't in the old 3-value type.
    accessLevel: dto.isFree ? "free" : dto.requiredTier ? dto.requiredTier : "premium",
    price: dto.priceKobo ? dto.priceKobo / 100 : 0,
    isFree: dto.isFree,
    views: dto.totalViews,
    likes: 0,
    downloads: dto.totalDownloads,
    rating: dto.averageRating,
    ratingCount: dto.totalRatings,
    completionRate: 0,
    // Archived (soft-deleted) takes priority over isPublished: an item
    // that's isPublished=true but isActive=false is NOT visible to
    // students (findAll requires both), so showing it as "published"
    // here would hide that disconnect from the admin.
    status: !dto.isActive ? "archived" : dto.isPublished ? "published" : "draft",
    quality: "standard",
    isFeatured: dto.isFeatured,
    isNew: isWithinDays(dto.createdAt, 14),
    isTrending: false,
    isVerified: dto.isPublished,
    isDownloadable: dto.isDownloadable,
    drmProtected: dto.drmProtected,
    tags: dto.tags?.length ? dto.tags : dto.topic ? [dto.topic] : [],
    dateAdded: dto.createdAt.split("T")[0],
    dateUpdated: dto.updatedAt.split("T")[0],
    thumbnailUrl: dto.thumbnailUrl ?? undefined,
    // Raw dto.fileUrl is an R2 object key for gated content, not a
    // playable URL — callers that need to actually render/play the file
    // (the admin PreviewTab) should resolve it via getPlaybackUrl(id) and
    // overwrite this field, the same way the student detail page does.
    fileUrl: dto.isFree ? dto.fileUrl : undefined,
    revenue: 0,
    conversionRate: 0,
    bounceRate: 0,
  };
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function isWithinDays(iso: string, days: number): boolean {
  const diff = Date.now() - new Date(iso).getTime();
  return diff < days * 24 * 60 * 60 * 1000;
}
