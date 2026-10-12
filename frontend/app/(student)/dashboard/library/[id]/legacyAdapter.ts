import type {
  LibraryContent as LegacyLibraryContent,
  RelatedItem,
  AccessReason,
  Subject as LegacySubject,
  SubscriptionTier as LegacyTier,
  ContentType as LegacyContentType,
} from "./types";
import type { LibraryContentDto } from "@/lib/api/library";

function up<T extends string>(v: string): T {
  return v.toUpperCase() as T;
}

/**
 * BackendContentType (lib/api/library.ts) has 8 values:
 *   ebook | video | image | document | audio | quiz | past_question | practice_set
 * This detail page's local ContentType union (types.ts) only has 7, and two
 * of those (LESSON_NOTE, INFOGRAPHIC) don't even exist on the backend. A
 * plain .toUpperCase() therefore produces "IMAGE" / "QUIZ" / "PRACTICE_SET"
 * for those three backend values — none of which are keys in CONTENT_CFG —
 * so CONTENT_CFG[content.contentType] comes back undefined and reading
 * `.icon` off it crashes the page. This explicit, exhaustive map is the fix:
 * TypeScript will fail to compile if the backend ever adds a 9th value that
 * isn't accounted for here.
 */
const CONTENT_TYPE_MAP: Record<LibraryContentDto["contentType"], LegacyContentType> = {
  video: "VIDEO",
  audio: "AUDIO",
  ebook: "EBOOK",
  document: "DOCUMENT",
  past_question: "PAST_QUESTION",
  image: "INFOGRAPHIC",
  quiz: "PAST_QUESTION",
  practice_set: "PAST_QUESTION",
};

function mapContentType(t: LibraryContentDto["contentType"]): LegacyContentType {
  return CONTENT_TYPE_MAP[t] ?? "DOCUMENT";
}

/**
 * The detail-page UI (this folder's config.ts/types.ts/Player/TabPanels/
 * RelatedTab) was originally built mocked against UPPERCASE enum values
 * ("VIDEO", "MATHEMATICS", "WAEC"...). The real backend uses lowercase
 * values (see src/common/enums/enums.ts). Rather than rewrite five
 * already-built presentational components, this adapter translates real
 * API responses into the shape they expect — a boring but low-risk fix.
 *
 * `resolvedFileUrl` should be the value from GET /library/:id/play (a
 * signed URL for gated content, the public CDN URL for free content) —
 * never pass the raw `fileUrl` field through for gated content, since
 * that's just the R2 object key, not something a <video>/<iframe> can load.
 */
export function adaptToLegacyContent(
  dto: LibraryContentDto,
  resolvedFileUrl: string | null,
): LegacyLibraryContent {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    contentType: mapContentType(dto.contentType),
    subject: dto.subject ? up<LegacySubject>(dto.subject) : null,
    topic: dto.topic,
    fileUrl: resolvedFileUrl ?? (dto.isFree ? dto.fileUrl : ""),
    thumbnailUrl: dto.thumbnailUrl,
    durationSeconds: dto.durationSeconds,
    totalPages: dto.totalPages,
    fileSizeBytes: dto.fileSizeBytes,
    examTypes: dto.examTypes.map((e) => up(e)) as LegacyLibraryContent["examTypes"],
    classLevels: dto.classLevels.map((c) => up(c)) as LegacyLibraryContent["classLevels"],
    isFree: dto.isFree,
    requiredTier: dto.requiredTier ? up<LegacyTier>(dto.requiredTier) : null,
    priceKobo: dto.priceKobo,
    totalViews: dto.totalViews,
    totalDownloads: dto.totalDownloads,
    averageRating: dto.averageRating,
    isActive: dto.isActive,
    isPublished: dto.isPublished,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function adaptToRelatedItem(dto: LibraryContentDto): RelatedItem {
  return {
    id: dto.id,
    title: dto.title,
    contentType: mapContentType(dto.contentType),
    thumbnailUrl: dto.thumbnailUrl,
    averageRating: dto.averageRating,
    isFree: dto.isFree,
    requiredTier: dto.requiredTier ? up<LegacyTier>(dto.requiredTier) : null,
    priceKobo: dto.priceKobo,
    subject: dto.subject ? up<LegacySubject>(dto.subject) : null,
    durationSeconds: dto.durationSeconds,
    totalPages: dto.totalPages,
  };
}

export function toAccessReason(reason: string | undefined): AccessReason {
  const known: AccessReason[] = ["free", "owned", "subscription", "no_access", "expired"];
  return (known as string[]).includes(reason ?? "") ? (reason as AccessReason) : "no_access";
}
