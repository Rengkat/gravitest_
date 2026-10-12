// Mirrors backend enums from src/common/enums/enums

export type ContentType =
  | "VIDEO"
  | "AUDIO"
  | "EBOOK"
  | "DOCUMENT"
  | "PAST_QUESTION"
  | "LESSON_NOTE"
  | "INFOGRAPHIC";

export type Subject =
  | "MATHEMATICS"
  | "ENGLISH"
  | "PHYSICS"
  | "CHEMISTRY"
  | "BIOLOGY"
  | "ECONOMICS"
  | "GOVERNMENT"
  | "LITERATURE"
  | "GEOGRAPHY"
  | "HISTORY"
  | "COMMERCE"
  | "ACCOUNTING"
  | "FURTHER_MATHEMATICS"
  | "AGRICULTURAL_SCIENCE"
  | "CIVIC_EDUCATION";

export type ExamType = "WAEC" | "NECO" | "JAMB" | "NABTEB" | "COMMON_ENTRANCE";
export type ClassLevel = "JSS1" | "JSS2" | "JSS3" | "SS1" | "SS2" | "SS3";
export type SubscriptionTier = "FREE" | "BASIC" | "STANDARD" | "PREMIUM" | "ENTERPRISE";
export type AccessReason = "free" | "owned" | "subscription" | "no_access" | "expired";

// Mirrors LibraryContent entity
export interface LibraryContent {
  id: string;
  title: string;
  description: string | null;
  contentType: ContentType;
  subject: Subject | null;
  topic: string | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  totalPages: number | null;
  fileSizeBytes: number | null;
  examTypes: ExamType[];
  classLevels: ClassLevel[];
  isFree: boolean;
  requiredTier: SubscriptionTier | null;
  priceKobo: number | null;
  totalViews: number;
  totalDownloads: number;
  averageRating: number;
  ratingCount?: number;
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  // Frontend-enriched
  author?: string;
  previewSeconds?: number;
  previewPages?: number;
  tags?: string[];
}

// Mirrors LibraryAccess entity
export interface LibraryAccess {
  id: string;
  userId: string;
  contentId: string;
  contentType: ContentType;
  expiresAt: string | null;
  viewCount: number;
  downloadCount: number;
  progressPercent: number;
  lastAccessedAt: string | null;
  bookmarks: { position: number; note?: string; createdAt: string }[] | null;
  highlights:
    | { startOffset: number; endOffset: number; text: string; color: string; note?: string }[]
    | null;
  paymentId: string | null;
  createdAt: string;
}

export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: AccessReason;
  accessRecord?: LibraryAccess;
}

export interface RatingEntry {
  id: string;
  userId: string;
  userName: string;
  initials: string;
  rating: number;
  review?: string;
  createdAt: string;
  helpful: number;
}

export type RelatedItem = Pick<
  LibraryContent,
  | "id"
  | "title"
  | "contentType"
  | "thumbnailUrl"
  | "averageRating"
  | "isFree"
  | "requiredTier"
  | "priceKobo"
  | "subject"
  | "durationSeconds"
  | "totalPages"
>;
