import type {
  LibraryContent,
  AccessCheckResult,
  LibraryAccess,
  RatingEntry,
  RelatedItem,
} from "./types";

export function getMockContent(id: string): LibraryContent {
  const n = id?.charCodeAt(id.length - 1) % 7;

  const shared = {
    id,
    isActive: true,
    isPublished: true,
    totalViews: 5_840,
    totalDownloads: 1_620,
    averageRating: 4.6,
    ratingCount: 312,
    createdAt: "2024-09-01T00:00:00Z",
    updatedAt: "2025-03-15T00:00:00Z",
    examTypes: ["WAEC", "NECO"] as any,
    classLevels: ["SS2", "SS3"] as any,
    author: "Gravitas Academic Team",
    tags: ["exam prep", "2024"],
  };

  const items: LibraryContent[] = [
    // 0 — Free video
    {
      ...shared,
      contentType: "VIDEO",
      isFree: true,
      requiredTier: null,
      priceKobo: null,
      title: "Complete WAEC Mathematics: Algebra & Calculus Masterclass",
      description:
        "A full walkthrough of WAEC Mathematics covering Algebra, Calculus, Trigonometry and Statistics. Taught by experienced examiners with real past question references throughout.",
      subject: "MATHEMATICS",
      topic: "Algebra, Calculus, Trigonometry",
      fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailUrl: "https://picsum.photos/seed/mathvid/800/450",
      durationSeconds: 5_400,
      totalPages: null,
      fileSizeBytes: 420_000_000,
      previewSeconds: 90,
      author: "Mr. Adewale Obi (MSc, UNILAG)",
    },

    // 1 — Premium video
    {
      ...shared,
      contentType: "VIDEO",
      isFree: false,
      requiredTier: "PREMIUM",
      priceKobo: null,
      title: "JAMB Biology: Genetics, Evolution & Ecology — Full Series",
      description:
        "Comprehensive video series covering all JAMB Biology topics. Detailed genetics problems, evolutionary theory and ecosystem analysis with 2024 syllabus updates.",
      subject: "BIOLOGY",
      topic: "Genetics, Evolution, Ecology",
      fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailUrl: "https://picsum.photos/seed/biovid/800/450",
      durationSeconds: 7_200,
      totalPages: null,
      fileSizeBytes: 680_000_000,
      previewSeconds: 90,
      author: "Dr. Ngozi Eze (PhD, UNIPORT)",
    },

    // 2 — Free ebook
    {
      ...shared,
      contentType: "EBOOK",
      isFree: true,
      requiredTier: null,
      priceKobo: null,
      title: "NECO Chemistry: Comprehensive Theory & Practicals Guide",
      description:
        "400-page ebook covering every NECO Chemistry topic. Includes lab safety, organic chemistry, electrochemistry and titration calculations with worked examples.",
      subject: "CHEMISTRY",
      topic: "Organic Chemistry, Electrochemistry",
      fileUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF2.pdf",
      thumbnailUrl: "https://picsum.photos/seed/chemebook/800/450",
      durationSeconds: null,
      totalPages: 400,
      fileSizeBytes: 12_500_000,
      previewPages: 5,
    },

    // 3 — Paid document
    {
      ...shared,
      contentType: "DOCUMENT",
      isFree: false,
      requiredTier: null,
      priceKobo: 150_000,
      title: "WAEC Economics: 20 Years of Past Questions with Model Answers",
      description:
        "Complete WAEC Economics past questions from 2003–2023 with full model answers, examiner comments and topic-by-topic breakdown.",
      subject: "ECONOMICS",
      topic: "Macroeconomics, Microeconomics",
      fileUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF2.pdf",
      thumbnailUrl: "https://picsum.photos/seed/ecodoc/800/450",
      durationSeconds: null,
      totalPages: 280,
      fileSizeBytes: 8_200_000,
      previewPages: 2,
    },

    // 4 — Free audio
    {
      ...shared,
      contentType: "AUDIO",
      isFree: true,
      requiredTier: null,
      priceKobo: null,
      title: "English Language: Oral English & Comprehension Revision",
      description:
        "Audio series covering WAEC Oral English pronunciation, vowels, consonants, syllable stress and comprehension exercises narrated by a professional linguist.",
      subject: "ENGLISH",
      topic: "Oral English, Comprehension",
      fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      thumbnailUrl: "https://picsum.photos/seed/engaudio/800/450",
      durationSeconds: 3_600,
      totalPages: null,
      fileSizeBytes: 52_000_000,
      previewSeconds: 60,
      author: "Mrs. Funke Adeyemi (Linguistics, LASU)",
    },

    // 5 — Standard-gated lesson note
    {
      ...shared,
      contentType: "LESSON_NOTE",
      isFree: false,
      requiredTier: "STANDARD",
      priceKobo: null,
      title: "SS2 Physics: Mechanics & Thermodynamics — Complete Lesson Notes",
      description:
        "Structured lesson notes for SS2 Physics covering Newtonian mechanics, heat transfer, thermodynamic laws and wave motion. Ideal for classroom and self-study use.",
      subject: "PHYSICS",
      topic: "Mechanics, Thermodynamics, Waves",
      fileUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF2.pdf",
      thumbnailUrl: "https://picsum.photos/seed/physnote/800/450",
      durationSeconds: null,
      totalPages: 85,
      fileSizeBytes: 3_400_000,
      previewPages: 2,
      classLevels: ["SS2"] as any,
    },

    // 6 — Paid past questions
    {
      ...shared,
      contentType: "PAST_QUESTION",
      isFree: false,
      requiredTier: null,
      priceKobo: 200_000,
      title: "JAMB Mathematics: 10 Years CBT Past Questions (2014–2024)",
      description:
        "Complete JAMB Mathematics CBT past questions with full solutions and time-attack practice mode. Includes topic tagging and performance analytics.",
      subject: "MATHEMATICS",
      topic: "All JAMB Topics",
      fileUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF2.pdf",
      thumbnailUrl: "https://picsum.photos/seed/jambmaths/800/450",
      durationSeconds: null,
      totalPages: 320,
      fileSizeBytes: 9_800_000,
      previewPages: 2,
      examTypes: ["JAMB"] as any,
      classLevels: ["SS3"] as any,
    },
  ];

  return items[n] ?? items[0];
}

export function getMockAccess(id: string): AccessCheckResult {
  const n = id?.charCodeAt(id.length - 1) % 7;
  // 0, 2, 4 = free (full access); rest = no access
  if ([0, 2, 4].includes(n)) return { hasAccess: true, reason: "free" };
  return { hasAccess: false, reason: "no_access" };
}

export function getMockAccessRecord(): LibraryAccess {
  return {
    id: "acc-001",
    userId: "user-001",
    contentId: "c-001",
    contentType: "VIDEO",
    expiresAt: null,
    viewCount: 7,
    downloadCount: 1,
    progressPercent: 42,
    lastAccessedAt: "2025-05-20T10:00:00Z",
    bookmarks: [
      { position: 120, note: "Important formula", createdAt: "2025-05-10T09:00:00Z" },
      { position: 900, note: "Key worked example", createdAt: "2025-05-12T11:00:00Z" },
    ],
    highlights: null,
    paymentId: null,
    createdAt: "2025-04-01T00:00:00Z",
  };
}

export function getMockRatings(): RatingEntry[] {
  return [
    {
      id: "r1",
      userId: "u1",
      userName: "Adewale O.",
      initials: "AO",
      rating: 5,
      review:
        "Absolutely brilliant. The explanations are clear and the worked examples match exactly what comes up in WAEC. Highly recommended for SS3 students.",
      createdAt: "2025-05-01T10:00:00Z",
      helpful: 34,
    },
    {
      id: "r2",
      userId: "u2",
      userName: "Chidinma E.",
      initials: "CE",
      rating: 5,
      review:
        "I revised for two weeks before my exam using this and my score improved significantly. The instructor breaks everything down very well.",
      createdAt: "2025-04-28T14:00:00Z",
      helpful: 28,
    },
    {
      id: "r3",
      userId: "u3",
      userName: "Femi A.",
      initials: "FA",
      rating: 4,
      review:
        "Very comprehensive. Covers the full syllabus. Would have been 5 stars if there were more practice questions at the end of each section.",
      createdAt: "2025-04-20T09:30:00Z",
      helpful: 19,
    },
    {
      id: "r4",
      userId: "u4",
      userName: "Blessing N.",
      initials: "BN",
      rating: 4,
      review:
        "Good content overall. Audio quality could be a bit better in some sections but the explanations are excellent.",
      createdAt: "2025-04-15T16:00:00Z",
      helpful: 11,
    },
    {
      id: "r5",
      userId: "u5",
      userName: "Ibrahim K.",
      initials: "IK",
      rating: 3,
      review:
        "Decent material but expected more depth on thermodynamics. The other chapters are excellent though.",
      createdAt: "2025-04-10T11:00:00Z",
      helpful: 6,
    },
  ];
}

export function getMockRelated(): RelatedItem[] {
  return [
    {
      id: "r1",
      title: "WAEC Maths: Statistics & Probability",
      contentType: "VIDEO",
      thumbnailUrl: "https://picsum.photos/seed/rel1/400/225",
      averageRating: 4.7,
      isFree: true,
      requiredTier: null,
      priceKobo: null,
      subject: "MATHEMATICS",
      durationSeconds: 3600,
      totalPages: null,
    },
    {
      id: "r2",
      title: "SS3 Physics Complete Lesson Notes",
      contentType: "LESSON_NOTE",
      thumbnailUrl: "https://picsum.photos/seed/rel2/400/225",
      averageRating: 4.4,
      isFree: false,
      requiredTier: "STANDARD",
      priceKobo: null,
      subject: "PHYSICS",
      durationSeconds: null,
      totalPages: 90,
    },
    {
      id: "r3",
      title: "NECO Chemistry Past Questions 2015–2024",
      contentType: "PAST_QUESTION",
      thumbnailUrl: "https://picsum.photos/seed/rel3/400/225",
      averageRating: 4.5,
      isFree: false,
      requiredTier: null,
      priceKobo: 100000,
      subject: "CHEMISTRY",
      durationSeconds: null,
      totalPages: 240,
    },
    {
      id: "r4",
      title: "Biology: Cell Structure & Metabolism",
      contentType: "EBOOK",
      thumbnailUrl: "https://picsum.photos/seed/rel4/400/225",
      averageRating: 4.8,
      isFree: true,
      requiredTier: null,
      priceKobo: null,
      subject: "BIOLOGY",
      durationSeconds: null,
      totalPages: 180,
    },
  ];
}
