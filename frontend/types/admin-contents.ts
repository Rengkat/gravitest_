// ─── ENUMS ──────────────────────────────────────────────────
export type ContentType =
  | "ebook"
  | "video"
  | "image"
  | "document"
  | "audio"
  | "interactive"
  | "flashcard"
  | "quiz";

export type ContentStatus = "published" | "draft" | "archived" | "review";
// Must match the backend's real SubscriptionTier enum values exactly
// (src/common/enums/enums.ts): free, basic, standard, premium, enterprise.
// "basic"/"standard" are missing here on purpose in an earlier version —
// that was a bug, not a design choice: the /plans page actually sells
// basic/standard/premium as self-serve subscriptions, so content had no
// way to be gated at the two tiers most subscribers are actually on.
export type AccessLevel = "free" | "basic" | "standard" | "premium" | "enterprise";
export type ContentAudience = "secondary" | "professional";
export type ContentQuality = "basic" | "standard" | "premium" | "gold";
export type SortField = "title" | "views" | "downloads" | "rating" | "revenue" | "dateAdded";
export type ViewMode = "grid" | "list" | "analytics";

// ─── EXAM / SUBJECT ENUMS ───────────────────────────────────
/** Secondary exams */
export type SecondaryExam = "jamb" | "waec" | "neco" | "nabteb" | "bece" | "junior_neco";

/** Professional exams */
export type ProfessionalExam = "ican" | "nmcn" | "cipm" | "nim" | "niesv";

export type ExamTarget = SecondaryExam | ProfessionalExam | "all";

export type SubjectCategory =
  | "mathematics"
  | "english"
  | "physics"
  | "chemistry"
  | "biology"
  | "economics"
  | "government"
  | "literature"
  | "commerce"
  | "geography"
  | "accounting"
  | "nursing"
  | "hr_management"
  | "management"
  | "estate"
  | "all";

// ─── CONTENT ITEM ───────────────────────────────────────────
export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  description: string;

  // Classification
  subject: SubjectCategory;
  audience: ContentAudience;
  examTarget: ExamTarget;
  examLabel: string; // human-readable e.g. "WAEC" or "ICAN"

  // File details
  pages?: number;
  size: string;
  duration?: string; // e.g. "42:30" for video/audio
  format?: string;

  // Author
  author: string;
  uploaderName: string;

  // Access & Pricing
  accessLevel: AccessLevel;
  price: number; // 0 if free
  discountPrice?: number;
  discountExpiry?: string;
  isFree: boolean;

  // Engagement
  views: number;
  likes: number;
  downloads: number;
  rating: number; // 1-5
  ratingCount: number;
  completionRate: number; // 0-100

  // Flags
  status: ContentStatus;
  quality: ContentQuality;
  isFeatured: boolean;
  isNew: boolean;
  isTrending: boolean;
  isVerified: boolean;
  isDownloadable: boolean;
  drmProtected: boolean;

  // Metadata
  tags: string[];
  dateAdded: string;
  dateUpdated: string;
  thumbnailUrl?: string;
  fileUrl?: string;

  // Analytics
  revenue: number;
  conversionRate: number; // 0-100
  bounceRate: number; // 0-100

  // Series
  seriesName?: string;
  partNumber?: number;
}

// ─── AGGREGATE STATS ────────────────────────────────────────
export interface ContentStats {
  totalItems: number;
  byType: Record<ContentType, number>;
  byAccess: { free: number; basic: number; standard: number; premium: number; enterprise: number };
  byAudience: { secondary: number; professional: number };
  byStatus: { published: number; draft: number; archived: number; review: number };

  totalViews: number;
  totalDownloads: number;
  totalRevenue: number;
  averageRating: number;

  featuredItems: number;
  trendingItems: number;
  newItems: number;

  topAuthors: { name: string; items: number; revenue: number }[];
  topSubjects: { subject: string; items: number; views: number }[];
  revenueByType: { type: ContentType; revenue: number }[];
  viewsByMonth: { month: string; views: number }[];
}

// ─── FILTERS ────────────────────────────────────────────────
export interface ContentFilters {
  type: ContentType | "";
  accessLevel: AccessLevel | "";
  subject: SubjectCategory | "";
  audience: ContentAudience | "";
  examTarget: ExamTarget | "";
  status: ContentStatus | "";
  isFeatured: string;
  isFree: string;
  minRating: string;
  dateFrom: string;
  dateTo: string;
}
