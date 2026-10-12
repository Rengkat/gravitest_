import {
  BookOpen,
  Video,
  ImageIcon,
  FileText,
  Library as LibraryIcon,
  Calculator,
  Zap,
  FlaskConical,
  Leaf,
  TrendingUp,
  Users,
  Bookmark,
  FolderOpen,
  LucideIcon,
} from "lucide-react";
import { ContentType, ExamType, Level, Subject } from "@/types/library";

export const SUBJECTS: { id: Subject; name: string; icon: LucideIcon }[] = [
  { id: "all", name: "All Subjects", icon: FolderOpen },
  { id: "mathematics", name: "Mathematics", icon: Calculator },
  { id: "english", name: "English", icon: BookOpen },
  { id: "physics", name: "Physics", icon: Zap },
  { id: "chemistry", name: "Chemistry", icon: FlaskConical },
  { id: "biology", name: "Biology", icon: Leaf },
  { id: "economics", name: "Economics", icon: TrendingUp },
  { id: "government", name: "Government", icon: Users },
  { id: "literature", name: "Literature", icon: Bookmark },
];

export const LEVELS: { id: Level; name: string }[] = [
  { id: "all", name: "All Levels" },
  { id: "sss1", name: "SSS 1" },
  { id: "sss2", name: "SSS 2" },
  { id: "sss3", name: "SSS 3" },
  { id: "jamb", name: "JAMB" },
  { id: "university", name: "University" },
];

export const EXAM_TYPES: { id: ExamType; name: string }[] = [
  { id: "all", name: "All Exams" },
  { id: "jamb", name: "JAMB" },
  { id: "waec", name: "WAEC" },
  { id: "neco", name: "NECO" },
  { id: "nabteb", name: "NABTEB" },
  { id: "professional", name: "Professional" },
];

export const CONTENT_TABS: { id: ContentType; name: string; icon: LucideIcon }[] = [
  { id: "all", name: "All", icon: LibraryIcon },
  { id: "ebooks", name: "eBooks", icon: BookOpen },
  { id: "videos", name: "Videos", icon: Video },
  { id: "images", name: "Images", icon: ImageIcon },
  { id: "documents", name: "Documents", icon: FileText },
];

export const SUBJECT_GRADIENTS: Record<Subject, string> = {
  all: "from-gray-100 to-gray-50",
  mathematics: "from-blue-50 to-indigo-50",
  english: "from-green-50 to-emerald-50",
  physics: "from-amber-50 to-yellow-50",
  chemistry: "from-purple-50 to-violet-50",
  biology: "from-lime-50 to-green-50",
  economics: "from-orange-50 to-amber-50",
  government: "from-slate-50 to-gray-50",
  literature: "from-rose-50 to-pink-50",
};
