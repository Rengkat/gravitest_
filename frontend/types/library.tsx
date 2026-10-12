export type ContentType = "all" | "ebooks" | "videos" | "images" | "documents";
export type Subject =
  | "all"
  | "mathematics"
  | "english"
  | "physics"
  | "chemistry"
  | "biology"
  | "economics"
  | "government"
  | "literature";
export type Level = "all" | "sss1" | "sss2" | "sss3" | "jamb" | "university";
export type ExamType = "all" | "jamb" | "waec" | "neco" | "nabteb" | "professional";
export type SortMode = "latest" | "popular" | "rating";
export type ViewMode = "grid" | "list";

export interface LibraryItem {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  subject: Subject;
  level: Level;
  examType: ExamType;
  duration?: string;      // videos
  pages?: number;         // ebooks / documents
  size?: string;          // images / downloadable files
  author?: string;
  views: number;
  likes: number;
  downloads: number;
  rating: number;
  ratingCount: number;
  isPremium: boolean;     // true = not a free item (classification: badges, filters)
  /**
   * Is it locked for THIS student right now? A subscriber looking at content
   * their plan includes, or someone who already bought an item, gets false —
   * so no "Unlock"/"Upgrade" prompts. Falls back to isPremium when the server
   * didn't say (use isItemLocked()).
   */
  isLocked?: boolean;
  /** How it is unlocked: by a plan, or bought one by one whatever plan you are on. */
  accessModel?: "free" | "subscription" | "purchase";
  price?: number;         // in NGN — only if accessModel is "purchase"
  isNew: boolean;
  isTrending: boolean;
  isFeatured: boolean;
  dateAdded: string;
  tags: string[];
  previewAvailable: boolean; // can show first X pages / first N minutes for free
  thumbnailUrl?: string;
}

export interface LibraryFilters {
  contentType: ContentType;
  subject: Subject;
  level: Level;
  examType: ExamType;
  sortMode: SortMode;
  searchQuery: string;
  showPremiumOnly: boolean;
  showFreeOnly: boolean;
}
