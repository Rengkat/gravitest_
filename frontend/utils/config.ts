import {
  Brain,
  BookOpen,
  Library,
  FlaskConical,
  GraduationCap,
  Landmark,
  Calculator,
  Stethoscope,
  Users,
  Briefcase,
  BarChart,
  CircleDot,
  PenLine,
  Microscope,
  Layers,
  CheckCircle,
  AlertCircle,
  Building2,
  Radio,
  Ruler,
  Compass,
  TestTube,
  Pill,
  School,
  ListChecks,
  SplitSquareHorizontal,
  FileQuestion,
} from "lucide-react";
import {
  ExamType,
  CandidateType,
  CANDIDATE_TYPE_EXAM_TYPES,
  QuestionType,
  DifficultyLevel,
  QuestionStatus,
} from "@/types/questions";

export { CANDIDATE_TYPE_EXAM_TYPES };

// True for the exam types (WAEC, NECO, NABTEB, BECE, Junior NECO) that
// register candidates as either "school" (internal) or "private"
// (external) — used to decide whether to show the candidate-type
// selector at all, in both the admin question forms/filters and the
// student practice wizard.
export function isCandidateTypeExam(examType: ExamType | ""): boolean {
  return !!examType && CANDIDATE_TYPE_EXAM_TYPES.includes(examType);
}

export const CANDIDATE_TYPE_CONFIG: Record<
  CandidateType,
  { label: string; shortLabel: string; description: string }
> = {
  school: {
    label: "School Candidate",
    shortLabel: "School",
    description: "Registered through a recognized secondary school (internal candidate).",
  },
  private: {
    label: "Private Candidate",
    shortLabel: "Private",
    description: "Registered individually, not through a school (external candidate).",
  },
};

// ── Exam visual configs ───────────────────────────────────────────────────
// Covers all 19 real backend ExamType values (src/common/enums/enums.ts)
// — the old config only had 11, so 8 real exam types (cibn, nse, icen,
// niqs, arcon, mlscn, pcn, common_entrance) would have crashed any
// component doing EXAM_CONFIG[examType] the moment real data included one.

export const EXAM_CONFIG: Record<ExamType, { icon: any; color: string; bg: string; ring: string }> =
  {
    jamb: {
      icon: Brain,
      color: "#7c3aed",
      bg: "from-violet-500 to-purple-600",
      ring: "ring-violet-400/30",
    },
    waec: {
      icon: BookOpen,
      color: "#0284c7",
      bg: "from-sky-500 to-blue-600",
      ring: "ring-sky-400/30",
    },
    neco: {
      icon: Library,
      color: "#059669",
      bg: "from-emerald-500 to-teal-600",
      ring: "ring-emerald-400/30",
    },
    nabteb: {
      icon: FlaskConical,
      color: "#d97706",
      bg: "from-amber-500 to-orange-500",
      ring: "ring-amber-400/30",
    },
    bece: {
      icon: GraduationCap,
      color: "#16a34a",
      bg: "from-green-500 to-emerald-500",
      ring: "ring-green-400/30",
    },
    junior_neco: {
      icon: Landmark,
      color: "#0d9488",
      bg: "from-teal-500 to-cyan-500",
      ring: "ring-teal-400/30",
    },
    ican: {
      icon: Calculator,
      color: "#dc2626",
      bg: "from-red-500 to-rose-600",
      ring: "ring-red-400/30",
    },
    nmcn: {
      icon: Stethoscope,
      color: "#0284c7",
      bg: "from-sky-500 to-blue-600",
      ring: "ring-sky-400/30",
    },
    cipm: {
      icon: Users,
      color: "#7c3aed",
      bg: "from-violet-500 to-purple-600",
      ring: "ring-violet-400/30",
    },
    nim: {
      icon: Briefcase,
      color: "#d97706",
      bg: "from-amber-500 to-yellow-500",
      ring: "ring-amber-400/30",
    },
    niesv: {
      icon: BarChart,
      color: "#059669",
      bg: "from-emerald-500 to-green-600",
      ring: "ring-emerald-400/30",
    },
    cibn: {
      icon: Building2,
      color: "#1d4ed8",
      bg: "from-blue-600 to-indigo-600",
      ring: "ring-blue-400/30",
    },
    nse: {
      icon: Radio,
      color: "#be185d",
      bg: "from-pink-600 to-rose-600",
      ring: "ring-pink-400/30",
    },
    icen: {
      icon: Ruler,
      color: "#0891b2",
      bg: "from-cyan-600 to-sky-600",
      ring: "ring-cyan-400/30",
    },
    niqs: {
      icon: Compass,
      color: "#65a30d",
      bg: "from-lime-600 to-green-600",
      ring: "ring-lime-400/30",
    },
    arcon: {
      icon: Building2,
      color: "#9333ea",
      bg: "from-purple-600 to-fuchsia-600",
      ring: "ring-purple-400/30",
    },
    mlscn: {
      icon: TestTube,
      color: "#0d9488",
      bg: "from-teal-600 to-emerald-600",
      ring: "ring-teal-400/30",
    },
    pcn: { icon: Pill, color: "#e11d48", bg: "from-rose-600 to-red-600", ring: "ring-rose-400/30" },
    common_entrance: {
      icon: School,
      color: "#ca8a04",
      bg: "from-yellow-600 to-amber-600",
      ring: "ring-yellow-400/30",
    },
    post_utme: {
      icon: PenLine,
      color: "#4f46e5",
      bg: "from-indigo-500 to-violet-600",
      ring: "ring-indigo-400/30",
    },
  };

export const EXAM_LABELS: Record<ExamType, { name: string; fullName: string }> = {
  jamb: { name: "JAMB", fullName: "Joint Admissions and Matriculation Board" },
  waec: { name: "WAEC", fullName: "West African Examinations Council" },
  neco: { name: "NECO", fullName: "National Examinations Council" },
  nabteb: { name: "NABTEB", fullName: "National Business and Technical Examinations Board" },
  bece: { name: "BECE", fullName: "Basic Education Certificate Examination" },
  junior_neco: { name: "Junior NECO", fullName: "Junior NECO" },
  post_utme: { name: "Post-UTME", fullName: "Post-Unified Tertiary Matriculation Examination" },
  ican: { name: "ICAN", fullName: "Institute of Chartered Accountants of Nigeria" },
  nmcn: { name: "NMCN", fullName: "Nursing and Midwifery Council of Nigeria" },
  cipm: { name: "CIPM", fullName: "Chartered Institute of Personnel Management" },
  nim: { name: "NIM", fullName: "Nigerian Institute of Management" },
  niesv: { name: "NIESV", fullName: "Nigerian Institution of Estate Surveyors and Valuers" },
  cibn: { name: "CIBN", fullName: "Chartered Institute of Bankers of Nigeria" },
  nse: { name: "NSE", fullName: "Nigerian Society of Engineers" },
  icen: { name: "ICEN", fullName: "Institution of Civil Engineers Nigeria" },
  niqs: { name: "NIQS", fullName: "Nigerian Institute of Quantity Surveyors" },
  arcon: { name: "ARCON", fullName: "Architects Registration Council of Nigeria" },
  mlscn: { name: "MLSCN", fullName: "Medical Laboratory Science Council of Nigeria" },
  pcn: { name: "PCN", fullName: "Pharmacists Council of Nigeria" },
  common_entrance: { name: "Common Entrance", fullName: "National Common Entrance Examination" },
};

// Only JAMB is genuinely MCQ-only in practice — everything else can have
// theory/essay/practical components too.
export const MCQ_ONLY_EXAMS = new Set<ExamType>(["jamb", "post_utme"]);

export const SECONDARY_EXAM_TYPES: ExamType[] = [
  "jamb",
  "waec",
  "neco",
  "nabteb",
  "bece",
  "junior_neco",
  "post_utme",
  "common_entrance",
];
export const PROFESSIONAL_EXAM_TYPES: ExamType[] = [
  "ican",
  "nmcn",
  "cipm",
  "nim",
  "niesv",
  "cibn",
  "nse",
  "icen",
  "niqs",
  "arcon",
  "mlscn",
  "pcn",
];

// ── Question type configs ─────────────────────────────────────────────────
// Matches the real 8-value backend QuestionType enum — the old config
// only had MCQ/THEORY/PRACTICAL/ALL.

export const TYPE_CONFIG: Record<
  QuestionType,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  mcq: {
    label: "MCQ",
    icon: CircleDot,
    color: "#3b82f6",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  theory: {
    label: "Theory",
    icon: PenLine,
    color: "#8b5cf6",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
  practical: {
    label: "Practical",
    icon: Microscope,
    color: "#14b8a6",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
  true_false: {
    label: "True/False",
    icon: SplitSquareHorizontal,
    color: "#f97316",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  fill_blanks: {
    label: "Fill in the Blanks",
    icon: FileQuestion,
    color: "#ec4899",
    bg: "bg-pink-50",
    border: "border-pink-200",
  },
  matching: {
    label: "Matching",
    icon: Layers,
    color: "#06b6d4",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
  },
  essay: {
    label: "Essay",
    icon: PenLine,
    color: "#7c3aed",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  objective: {
    label: "Objective",
    icon: ListChecks,
    color: "#0891b2",
    bg: "bg-sky-50",
    border: "border-sky-200",
  },
};

// ── Difficulty configs ────────────────────────────────────────────────────

export const DIFFICULTY_CONFIG: Record<
  DifficultyLevel,
  { label: string; color: string; bg: string; border: string; bar: string }
> = {
  easy: {
    label: "Easy",
    color: "#10b981",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
  },
  medium: {
    label: "Medium",
    color: "#f59e0b",
    bg: "bg-amber-50",
    border: "border-amber-200",
    bar: "bg-amber-500",
  },
  hard: {
    label: "Hard",
    color: "#ef4444",
    bg: "bg-red-50",
    border: "border-red-200",
    bar: "bg-red-500",
  },
};

// ── Status configs ────────────────────────────────────────────────────────
// The backend only tracks isActive: boolean — no draft/archived DB
// state, so those were dropped rather than left implying persistence
// that doesn't exist.

export const STATUS_CONFIG: Record<
  QuestionStatus,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  published: {
    label: "Published",
    icon: CheckCircle,
    color: "#16a34a",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  draft: {
    label: "Draft",
    icon: AlertCircle,
    color: "#d97706",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
};

// ── Category colours ──────────────────────────────────────────────────────

export const CATEGORY_CONFIG = {
  secondary: { bg: "from-green-500 to-emerald-600", iconColor: "text-white" },
  professional: { bg: "from-purple-500 to-violet-600", iconColor: "text-white" },
};

// ── Helpers ───────────────────────────────────────────────────────────────

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function pct(part: number, total: number): string {
  if (!total) return "0";
  return ((part / total) * 100).toFixed(1);
}
