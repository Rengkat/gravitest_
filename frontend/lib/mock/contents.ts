import type {
  ContentItem,
  ContentStats,
  ContentType,
  SubjectCategory,
  ContentAudience,
  ExamTarget,
  AccessLevel,
  ContentStatus,
  ContentQuality,
} from "@/types/admin-contents";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const TITLES: Record<ContentType, string[]> = {
  ebook: [
    "Complete Mathematics Guide",
    "Physics Made Easy",
    "WAEC Success Handbook",
    "JAMB Champion",
    "Biology Notes",
    "Economics for SS3",
    "Government Explained",
    "English Mastery",
  ],
  video: [
    "Calculus Step-by-Step",
    "Organic Chemistry Reactions",
    "Essay Writing Skills",
    "Financial Accounting Basics",
    "Electromagnetism Explained",
    "Cell Biology Deep Dive",
  ],
  image: [
    "Periodic Table HD",
    "Human Anatomy Chart",
    "Nigeria Map Resource",
    "Biology Diagrams",
    "Physics Formula Sheet",
    "Mathematical Charts",
  ],
  document: [
    "Past Questions 2015-2024",
    "Marking Scheme Collection",
    "Syllabus Summary Sheet",
    "ICAN Study Notes",
    "WAEC Marking Guides",
    "Quick Revision Cheatsheet",
  ],
  audio: [
    "Literature Poem Readings",
    "History Audio Notes",
    "Pronunciation Guide",
    "Economics Podcast",
    "Biology Dictation",
    "Oral English Practice",
  ],
  interactive: [
    "Algebra Problem Solver",
    "Periodic Table Explorer",
    "Physics Lab Simulation",
    "Graph Plotter Tool",
    "CBT Practice Engine",
    "Map Explorer",
  ],
  flashcard: [
    "Chemistry Equations Deck",
    "Vocabulary Builder",
    "Government Terms",
    "Biology Definitions",
    "Accounting Ratios",
    "Grammar Rules",
  ],
  quiz: [
    "JAMB Mock Test",
    "WAEC Practice Quiz",
    "ICAN Revision Test",
    "Biology Checkpoint",
    "Maths Drills",
    "English Grammar Quiz",
  ],
};

const AUTHORS = [
  "Dr. Adebayo Ola",
  "Prof. Chukwuma Eze",
  "Mrs. Grace Okonkwo",
  "Mr. Segun Adeyemi",
  "Dr. Fatima Musa",
  "Prof. Emeka Nwachukwu",
  "Mrs. Chioma Obi",
  "Mr. Tunde Bakare",
];

const SECONDARY_SUBJECTS: SubjectCategory[] = [
  "mathematics",
  "english",
  "physics",
  "chemistry",
  "biology",
  "economics",
  "government",
  "literature",
  "commerce",
  "geography",
];
const PROFESSIONAL_SUBJECTS: SubjectCategory[] = [
  "accounting",
  "nursing",
  "hr_management",
  "management",
  "estate",
];

const SECONDARY_EXAMS: ExamTarget[] = ["jamb", "waec", "neco", "nabteb", "bece", "junior_neco"];
const PROFESSIONAL_EXAMS: ExamTarget[] = ["ican", "nmcn", "cipm", "nim", "niesv"];

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
  all: "All",
};

export function generateMockContent(count: number): ContentItem[] {
  const types = Object.keys(TITLES) as ContentType[];
  const statuses: ContentStatus[] = [
    "published",
    "published",
    "published",
    "draft",
    "review",
    "archived",
  ];
  const access: AccessLevel[] = ["free", "free", "premium", "premium", "enterprise"];
  const quality: ContentQuality[] = ["basic", "standard", "premium", "gold"];

  return Array.from({ length: count }, (_, i) => {
    const type: ContentType = pick(types);
    const audience: ContentAudience = Math.random() > 0.3 ? "secondary" : "professional";
    const subject: SubjectCategory =
      audience === "secondary" ? pick(SECONDARY_SUBJECTS) : pick(PROFESSIONAL_SUBJECTS);
    const examTarget: ExamTarget =
      audience === "secondary" ? pick(SECONDARY_EXAMS) : pick(PROFESSIONAL_EXAMS);
    const accessLevel: AccessLevel = pick(access);
    const price = accessLevel === "free" ? 0 : rand(500, 15000);
    const views = rand(100, 50000);
    const downloads = Math.floor(views * (Math.random() * 0.4 + 0.1));
    const revenue =
      accessLevel === "free" ? 0 : Math.floor(downloads * price * (Math.random() * 0.3 + 0.05));

    return {
      id: `cnt_${(i + 1).toString().padStart(5, "0")}`,
      type,
      title:
        pick(TITLES[type]) +
        (i > TITLES[type].length ? ` Vol. ${Math.ceil(i / TITLES[type].length)}` : ""),
      description: `Comprehensive ${type} resource for ${EXAM_LABELS[examTarget]} ${subject} preparation. Covers all key topics with worked examples.`,
      subject,
      audience,
      examTarget,
      examLabel: EXAM_LABELS[examTarget] ?? examTarget,
      pages: ["ebook", "document"].includes(type) ? rand(20, 450) : undefined,
      size:
        type === "video"
          ? `${rand(50, 1800)} MB`
          : type === "audio"
            ? `${rand(5, 120)} MB`
            : `${rand(1, 45)} MB`,
      duration: ["video", "audio"].includes(type)
        ? `${rand(5, 90)}:${rand(10, 59).toString().padStart(2, "0")}`
        : undefined,
      format: pick(["PDF", "MP4", "EPUB", "DOCX", "MP3", "HTML", "PNG", "JSON"]),
      author: pick(AUTHORS),
      uploaderName: pick(AUTHORS),
      accessLevel,
      price,
      discountPrice: Math.random() > 0.8 && price > 0 ? Math.floor(price * 0.7) : undefined,
      isFree: accessLevel === "free",
      views,
      likes: Math.floor(views * Math.random() * 0.15),
      downloads,
      rating: parseFloat((3 + Math.random() * 2).toFixed(1)),
      ratingCount: rand(5, 800),
      completionRate: rand(30, 95),
      status: pick(statuses),
      quality: pick(quality),
      isFeatured: Math.random() > 0.85,
      isNew: Math.random() > 0.8,
      isTrending: Math.random() > 0.8,
      isVerified: Math.random() > 0.3,
      isDownloadable: Math.random() > 0.2,
      drmProtected: accessLevel !== "free" && Math.random() > 0.4,
      tags: [subject, examTarget, type, audience].filter(Boolean),
      dateAdded: new Date(2023, rand(0, 11), rand(1, 28)).toISOString().split("T")[0],
      dateUpdated: new Date(2024, rand(0, 3), rand(1, 28)).toISOString().split("T")[0],
      thumbnailUrl: Math.random() > 0.5 ? `https://picsum.photos/seed/${i}/400/250` : undefined,
      revenue,
      conversionRate: parseFloat((Math.random() * 30 + 2).toFixed(1)),
      bounceRate: parseFloat((Math.random() * 50 + 10).toFixed(1)),
      seriesName: Math.random() > 0.7 ? `${subject} Complete Series` : undefined,
      partNumber: Math.random() > 0.7 ? rand(1, 5) : undefined,
    };
  });
}

export function generateMockStats(items: ContentItem[]): ContentStats {
  const byType = {} as Record<ContentType, number>;
  const revenueByType = {} as Record<ContentType, number>;
  const bySubject = {} as Record<string, { items: number; views: number }>;

  for (const item of items) {
    byType[item.type] = (byType[item.type] || 0) + 1;
    revenueByType[item.type] = (revenueByType[item.type] || 0) + item.revenue;
    if (!bySubject[item.subject]) bySubject[item.subject] = { items: 0, views: 0 };
    bySubject[item.subject].items++;
    bySubject[item.subject].views += item.views;
  }

  return {
    totalItems: items.length,
    byType,
    byAccess: {
      free: items.filter((i) => i.isFree).length,
      premium: items.filter((i) => i.accessLevel === "premium").length,
      enterprise: items.filter((i) => i.accessLevel === "enterprise").length,
    },
    byAudience: {
      secondary: items.filter((i) => i.audience === "secondary").length,
      professional: items.filter((i) => i.audience === "professional").length,
    },
    byStatus: {
      published: items.filter((i) => i.status === "published").length,
      draft: items.filter((i) => i.status === "draft").length,
      archived: items.filter((i) => i.status === "archived").length,
      review: items.filter((i) => i.status === "review").length,
    },
    totalViews: items.reduce((s, i) => s + i.views, 0),
    totalDownloads: items.reduce((s, i) => s + i.downloads, 0),
    totalRevenue: items.reduce((s, i) => s + i.revenue, 0),
    averageRating: parseFloat((items.reduce((s, i) => s + i.rating, 0) / items.length).toFixed(1)),
    featuredItems: items.filter((i) => i.isFeatured).length,
    trendingItems: items.filter((i) => i.isTrending).length,
    newItems: items.filter((i) => i.isNew).length,
    topAuthors: [
      { name: "Dr. Adebayo Ola", items: 45, revenue: 2500000 },
      { name: "Prof. Chukwuma Eze", items: 38, revenue: 2100000 },
      { name: "Mrs. Grace Okonkwo", items: 32, revenue: 1800000 },
      { name: "Mr. Segun Adeyemi", items: 28, revenue: 1500000 },
      { name: "Dr. Fatima Musa", items: 22, revenue: 1100000 },
    ],
    topSubjects: Object.entries(bySubject)
      .sort(([, a], [, b]) => b.views - a.views)
      .slice(0, 6)
      .map(([subject, d]) => ({ subject, ...d })),
    revenueByType: Object.entries(revenueByType)
      .sort(([, a], [, b]) => b - a)
      .map(([type, revenue]) => ({ type: type as ContentType, revenue })),
    viewsByMonth: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i, 1).toLocaleString("default", { month: "short" }),
      views: Math.floor(Math.random() * 50000 + 20000),
    })),
  };
}
