import type { LucideIcon } from "lucide-react";
import { BookOpen, Brain, BarChart2, Lightbulb, Target, Award } from "lucide-react";

/* ─── Types ──────────────────────────────────────────────── */
export type CategoryId =
  | "all"
  | "jamb"
  | "waec"
  | "study-tips"
  | "ai-learning"
  | "success-stories";

export type Category = {
  id: CategoryId;
  label: string;
  Icon: LucideIcon;
};

export type Author = {
  initials: string;
  name: string;
  role: string;
};

export type Post = {
  slug: string;
  category: CategoryId;
  tag: string;
  title: string;
  excerpt: string;
  author: Author;
  date: string;
  readTime: string;
  featured?: boolean;
  gradientCls: string; // static literal — one of the gradient classes below
};

/* ─── Categories ─────────────────────────────────────────── */
export const CATEGORIES: Category[] = [
  { id: "all", label: "All Posts", Icon: BookOpen },
  { id: "jamb", label: "JAMB Guide", Icon: Target },
  { id: "waec", label: "WAEC Guide", Icon: Award },
  { id: "study-tips", label: "Study Tips", Icon: Lightbulb },
  { id: "ai-learning", label: "AI Learning", Icon: Brain },
  { id: "success-stories", label: "Success Stories", Icon: BarChart2 },
];

/* ─── Authors ────────────────────────────────────────────── */
const AUTHORS: Record<string, Author> = {
  tunde: { initials: "TF", name: "Tunde Fashola", role: "JAMB Expert & Content Lead" },
  ngozi: { initials: "NE", name: "Ngozi Eze", role: "WAEC Specialist" },
  emeka: { initials: "EA", name: "Emeka Adeyemi", role: "AI Education Researcher" },
  fatima: { initials: "FM", name: "Fatima Musa", role: "Study Skills Coach" },
  adaeze: { initials: "AO", name: "Adaeze Okonkwo", role: "Student Success Mentor" },
};

/* ─── Posts ──────────────────────────────────────────────────────────────────
   gradientCls must be a complete literal string — one of the six options.
   Tailwind's scanner cannot detect dynamically constructed gradient classes.
──────────────────────────────────────────────────────────────────────────── */
export const POSTS: Post[] = [
  /* ── FEATURED ── */
  {
    slug: "how-to-score-300-in-jamb-2025",
    category: "jamb",
    tag: "JAMB Guide",
    title: "How to Score 300+ in JAMB 2025: The Complete Roadmap",
    excerpt:
      "A step-by-step strategy used by 12,000+ Gravitest students to break the 300 barrier — covering subject selection, time allocation, weak topic targeting, and the final 72 hours.",
    author: AUTHORS.tunde,
    date: "Jan 14, 2025",
    readTime: "12 min read",
    featured: true,
    gradientCls: "from-green-900 to-green-700",
  },

  /* ── REGULAR ── */
  {
    slug: "waec-2026-digital-format-explained",
    category: "waec",
    tag: "WAEC Guide",
    title: "WAEC 2026 Digital Format: What Every SS3 Student Must Know",
    excerpt:
      "WAEC is switching to a new digital interface in 2026. Here's exactly what changes, which subjects are affected first, and how to practise on the exact interface before exam day.",
    author: AUTHORS.ngozi,
    date: "Jan 10, 2025",
    readTime: "8 min read",
    gradientCls: "from-green-800 to-green-600",
  },
  {
    slug: "sabi-explain-ai-how-it-works",
    category: "ai-learning",
    tag: "AI Learning",
    title: "How Sabi-Explain AI Understands Nigerian Students (And Why It Works)",
    excerpt:
      "Why does an AI that explains in Pidgin outperform standard tutoring? We break down the science behind contextual learning and how local examples improve retention by up to 40%.",
    author: AUTHORS.emeka,
    date: "Jan 7, 2025",
    readTime: "6 min read",
    gradientCls: "from-green-700 to-teal-700",
  },
  {
    slug: "5-study-habits-that-actually-work",
    category: "study-tips",
    tag: "Study Tips",
    title: "5 Study Habits That Actually Work for Nigerian Students (Backed by Science)",
    excerpt:
      "Forget reading your textbook 10 times. The top-scoring students use spaced repetition, active recall, and interleaving. Here's how to apply each one with Gravitest.",
    author: AUTHORS.fatima,
    date: "Jan 3, 2025",
    readTime: "7 min read",
    gradientCls: "from-green-800 to-green-700",
  },
  {
    slug: "how-tobi-fixed-his-weak-topics",
    category: "study-tips",
    tag: "Study Tips",
    title: "How Tobi Turned His Weakest Subject Into His Strongest in 6 Weeks",
    excerpt:
      "Tobi was scoring below 40% in Physics. Using Gravitest's weak topic tracker and AI-generated drills, he raised it to 78% by exam day. Here's exactly what he did.",
    author: AUTHORS.emeka,
    date: "Dec 28, 2024",
    readTime: "8 min read",
    gradientCls: "from-orange-800 to-orange-600",
  },
  {
    slug: "adaeze-scored-312-jamb-story",
    category: "success-stories",
    tag: "Success Story",
    title: "From 2 JAMB Failures to 312: Adaeze's Story",
    excerpt:
      "Adaeze failed JAMB in 2022 and 2023. In 2024, she used Gravitest for 90 days and scored 312. This is her exact study plan, the mistakes she fixed, and the moment everything clicked.",
    author: AUTHORS.adaeze,
    date: "Dec 20, 2024",
    readTime: "9 min read",
    gradientCls: "from-gold-dark to-green-700",
  },
  {
    slug: "jamb-syllabus-2025-changes",
    category: "jamb",
    tag: "JAMB Guide",
    title: "JAMB 2025 Syllabus Changes: Everything That's New (and What's Gone)",
    excerpt:
      "JAMB updated 7 subject syllabuses for 2025. We've gone through every change, highlighted what topics dropped, what got added, and how to adjust your preparation strategy.",
    author: AUTHORS.tunde,
    date: "Dec 15, 2024",
    readTime: "11 min read",
    gradientCls: "from-green-900 to-green-700",
  },
  {
    slug: "offline-studying-2g-nigeria",
    category: "study-tips",
    tag: "Study Tips",
    title: "How to Study Effectively Without Stable Internet (A Nigerian Student's Guide)",
    excerpt:
      "Over 60% of Nigerian students study in areas with poor connectivity. Here's how to download question banks, use Gravitest offline, and still have a full study session on a budget.",
    author: AUTHORS.fatima,
    date: "Dec 10, 2024",
    readTime: "5 min read",
    gradientCls: "from-teal-800 to-green-700",
  },
  {
    slug: "post-utme-secret-guide",
    category: "jamb",
    tag: "Post-UTME",
    title: "The Post-UTME Guide Nobody Gives You: School-by-School Strategies",
    excerpt:
      "UNILAG, UI, OAU, UNIBEN and 35+ universities all have different Post-UTME formats. This guide breaks down each school's pattern, cut-off tendencies, and which topics to focus on last.",
    author: AUTHORS.tunde,
    date: "Dec 5, 2024",
    readTime: "14 min read",
    gradientCls: "from-green-800 to-green-600",
  },
  {
    slug: "waec-essay-ai-marking",
    category: "waec",
    tag: "WAEC Guide",
    title: "Why Your WAEC English Essays Keep Losing Marks (And How AI Can Fix It)",
    excerpt:
      "Most students lose marks on the same three essay mistakes: poor structure, weak vocabulary transitions, and missing conclusion paragraphs. Gravitest's AI marking shows you exactly where.",
    author: AUTHORS.ngozi,
    date: "Nov 28, 2024",
    readTime: "7 min read",
    gradientCls: "from-green-700 to-green-600",
  },
  {
    slug: "parent-monitoring-child-exam-prep",
    category: "study-tips",
    tag: "For Parents",
    title: "How to Monitor Your Child's Exam Preparation Without Nagging",
    excerpt:
      "Parents who check Gravitest's weekly WhatsApp report spend less time asking \"have you read?\" and more time giving targeted encouragement. Here's how to use data to guide, not pressure.",
    author: AUTHORS.emeka,
    date: "Nov 20, 2024",
    readTime: "6 min read",
    gradientCls: "from-blue-900 to-green-800",
  },
  {
    slug: "bashir-6-as-waec-strategy",
    category: "success-stories",
    tag: "Success Story",
    title: "Bashir's 6 A's Strategy: What He Did Differently in the Last 30 Days",
    excerpt:
      "Bashir had Bs and Cs across the board until he changed one thing — he stopped re-reading notes and started doing timed practice with immediate AI feedback. Here's his 30-day sprint.",
    author: AUTHORS.adaeze,
    date: "Nov 14, 2024",
    readTime: "8 min read",
    gradientCls: "from-green-800 to-teal-700",
  },
];

/* ─── Newsletter ─────────────────────────────────────────── */
export const POPULAR_TAGS = [
  "JAMB 2025",
  "WAEC Tips",
  "Score 300+",
  "AI Tutoring",
  "Offline Study",
  "Post-UTME",
  "Study Plan",
  "Pidgin Learning",
  "CBT Practice",
];
