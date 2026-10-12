import { Zap, Trophy, PlayCircle, GraduationCap, Target, TrendingUp } from "lucide-react";

export const CATEGORIES = [
  { id: "all", label: "All Videos", icon: PlayCircle },
  { id: "getting-started", label: "Getting Started", icon: GraduationCap },
  { id: "cbt-practice", label: "CBT Practice", icon: Target },
  { id: "ai-features", label: "AI Features", icon: Zap },
  { id: "masterclasses", label: "Masterclasses", icon: Trophy },
  { id: "tips-tricks", label: "Tips & Tricks", icon: TrendingUp },
];

export type Video = {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  thumbnail: string;
  instructor?: string;
  views?: string;
  date?: string;
  featured?: boolean;
  level?: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
};

export const VIDEOS: Video[] = [
  {
    id: "getting-started-1",
    title: "Create Your Free Account",
    description:
      "Learn how to create your Gravitest account in under 2 minutes and start your exam preparation journey.",
    category: "getting-started",
    duration: "1:45",
    thumbnail: "/videos/thumbnails/create-account.jpg",
    level: "Beginner",
    views: "12.4K",
    date: "2024-01-15",
  },
  {
    id: "getting-started-2",
    title: "Set Your Exam Target & Study Plan",
    description:
      "Configure your target score, exam date, and let Gravitest create a personalized study plan for you.",
    category: "getting-started",
    duration: "3:12",
    thumbnail: "/videos/thumbnails/set-target.jpg",
    level: "Beginner",
    views: "8.7K",
    date: "2024-01-20",
  },
  {
    id: "cbt-practice-1",
    title: "Navigate the CBT Interface Like a Pro",
    description:
      "Master the exam interface: question navigator, flag system, and timer management.",
    category: "cbt-practice",
    duration: "5:23",
    thumbnail: "/videos/thumbnails/cbt-interface.jpg",
    level: "Intermediate",
    views: "15.2K",
    date: "2024-02-01",
    featured: true,
  },
  {
    id: "cbt-practice-2",
    title: "Practice vs Mock Exam Modes",
    description: "Understand the difference between practice sessions and full mock exams.",
    category: "cbt-practice",
    duration: "4:08",
    thumbnail: "/videos/thumbnails/exam-modes.jpg",
    level: "Beginner",
    views: "6.9K",
    date: "2024-02-10",
  },
  {
    id: "ai-features-1",
    title: "Sabi-Explain AI: Instant Answer Explanations",
    description: "See how AI explains every wrong answer to help you understand concepts deeply.",
    category: "ai-features",
    duration: "4:45",
    thumbnail: "/videos/thumbnails/sabi-explain.jpg",
    level: "Beginner",
    views: "21.3K",
    date: "2024-02-15",
    featured: true,
  },
  {
    id: "ai-features-2",
    title: "Chat with Sabi-Tutor: Your Personal AI Tutor",
    description:
      "Learn how to use the AI chat assistant for any question, in Pidgin English or voice input.",
    category: "ai-features",
    duration: "6:32",
    thumbnail: "/videos/thumbnails/sabi-tutor.jpg",
    level: "Intermediate",
    views: "14.8K",
    date: "2024-02-25",
  },
  {
    id: "masterclasses-1",
    title: "JAMB UTME: 7-Day Score Booster",
    description:
      "Intensive masterclass with proven strategies to improve your JAMB score by 50+ points.",
    category: "masterclasses",
    duration: "45:00",
    thumbnail: "/videos/thumbnails/jamb-booster.jpg",
    instructor: "Dr. Adeola Williams",
    level: "Advanced",
    views: "5.2K",
    date: "2024-03-01",
    featured: true,
  },
  {
    id: "masterclasses-2",
    title: "WAEC Essay Writing: How to Score A1",
    description: "Complete guide to structuring essays, using keywords, and impressing examiners.",
    category: "masterclasses",
    duration: "52:30",
    thumbnail: "/videos/thumbnails/waec-essay.jpg",
    instructor: "Mr. Olumide Adebayo",
    level: "Intermediate",
    views: "4.8K",
    date: "2024-03-10",
  },
  {
    id: "tips-tricks-1",
    title: "10 Study Hacks That Actually Work",
    description: "Science-backed study techniques to retain more information in less time.",
    category: "tips-tricks",
    duration: "8:15",
    thumbnail: "/videos/thumbnails/study-hacks.jpg",
    level: "Beginner",
    views: "18.9K",
    date: "2024-02-05",
  },
  {
    id: "tips-tricks-2",
    title: "How to Manage Exam Anxiety",
    description: "Proven techniques to stay calm, focused, and confident during your exams.",
    category: "tips-tricks",
    duration: "7:48",
    thumbnail: "/videos/thumbnails/exam-anxiety.jpg",
    level: "All Levels",
    views: "11.2K",
    date: "2024-02-18",
  },
  {
    id: "offline-mode",
    title: "Enable Offline Mode & Practice Without Data",
    description: "Step-by-step guide to downloading question banks and syncing answers offline.",
    category: "getting-started",
    duration: "3:56",
    thumbnail: "/videos/thumbnails/offline-mode.jpg",
    level: "Beginner",
    views: "9.3K",
    date: "2024-03-05",
  },
];
