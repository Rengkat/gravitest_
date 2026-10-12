import {
  Trophy,
  Puzzle,
  MapPin,
  Calculator,
  Flag,
  Brain,
  Gamepad2,
  Zap,
  Globe,
  BookOpen,
} from "lucide-react";
import type { GameSlug, GameCategory, GameStatus, Difficulty, Game, GameSettings } from "./types";

// ─── DEFAULT SETTINGS PER GAME ────────────────────────────────
export const DEFAULT_SETTINGS: Record<GameSlug, GameSettings> = {
  scholar: {
    difficultyLevels: ["easy", "medium", "hard"],
    timeLimit: 60,
    lives: 3,
    hintsEnabled: true,
    leaderboardEnabled: true,
    dailyChallenges: true,
    maxQuestions: 15,
    scoring: { basePoints: 500, timeBonus: true, streakBonus: true, streakMultiplier: 1.5 },
  },
  "word-connect": {
    difficultyLevels: ["easy", "medium", "hard"],
    timeLimit: 30,
    lives: 3,
    hintsEnabled: true,
    leaderboardEnabled: true,
    dailyChallenges: true,
    maxQuestions: 10,
    scoring: { basePoints: 100, timeBonus: true, streakBonus: true, streakMultiplier: 1.2 },
  },
  "madam-karmen": {
    difficultyLevels: ["easy", "medium", "hard"],
    timeLimit: 30,
    lives: 3,
    hintsEnabled: true,
    leaderboardEnabled: true,
    dailyChallenges: false,
    maxQuestions: 36,
    scoring: { basePoints: 100, timeBonus: true, streakBonus: true, streakMultiplier: 1.3 },
  },
  "algebra-heist": {
    difficultyLevels: ["easy", "medium", "hard", "expert"],
    timeLimit: 60,
    lives: 5,
    hintsEnabled: true,
    leaderboardEnabled: true,
    dailyChallenges: true,
    maxQuestions: 15,
    scoring: { basePoints: 200, timeBonus: true, streakBonus: true, streakMultiplier: 1.5 },
  },
  "nigerian-trail": {
    difficultyLevels: ["easy", "medium", "hard"],
    timeLimit: 0,
    lives: 1,
    hintsEnabled: false,
    leaderboardEnabled: true,
    dailyChallenges: false,
    maxQuestions: 20,
    scoring: { basePoints: 500, timeBonus: false, streakBonus: true, streakMultiplier: 1.2 },
  },
  "zombie-logic": {
    difficultyLevels: ["easy", "medium", "hard", "expert"],
    timeLimit: 0,
    lives: 3,
    hintsEnabled: true,
    leaderboardEnabled: true,
    dailyChallenges: true,
    maxQuestions: 10,
    scoring: { basePoints: 300, timeBonus: false, streakBonus: true, streakMultiplier: 1.4 },
  },
};

// ─── GAME METADATA ────────────────────────────────────────────
export const GAME_CONFIGS: Record<
  GameSlug,
  {
    name: string;
    icon: any;
    color: string;
    bg: string;
    category: GameCategory;
    description: string;
    questionLabel: string; // what the admin calls "questions" for this game
    subjectBased: boolean; // does it have per-subject question banks?
    subjects?: string[];
    classLevels?: string[];
  }
> = {
  scholar: {
    name: "Who Wants to Be a Scholar?",
    icon: Trophy,
    color: "#f59e0b",
    bg: "#fef3c7",
    category: "trivia",
    description: "Answer 15 questions correctly to win ₦1,000,000!",
    questionLabel: "Questions",
    subjectBased: true,
    subjects: [
      "Chemistry",
      "Mathematics",
      "Physics",
      "Biology",
      "English",
      "Geography",
      "History",
      "Economics",
    ],
  },
  "word-connect": {
    name: "Word Connect",
    icon: Puzzle,
    color: "#8b5cf6",
    bg: "#ede9fe",
    category: "puzzle",
    description: "Fill the board by spelling words correctly.",
    questionLabel: "Puzzles",
    subjectBased: true,
    subjects: ["math", "science", "english", "history", "geo", "tech"],
  },
  "madam-karmen": {
    name: "Where in Nigeria is Madam Karmen?",
    icon: MapPin,
    color: "#10b981",
    bg: "#d1fae5",
    category: "adventure",
    description: "Track Madam Karmen across all 36 states using clues.",
    questionLabel: "Locations",
    subjectBased: false,
  },
  "algebra-heist": {
    name: "Biodun's Algebra Heist",
    icon: Calculator,
    color: "#3b82f6",
    bg: "#dbeafe",
    category: "academic",
    description: "Solve algebra equations to unlock doors and escape.",
    questionLabel: "Equations",
    subjectBased: false,
    classLevels: ["JSS1", "JSS2", "JSS3", "SSS1", "SSS2", "SSS3"],
  },
  "nigerian-trail": {
    name: "The Nigerian Trail",
    icon: Flag,
    color: "#2e8b57",
    bg: "#dcfce7",
    category: "adventure",
    description: "Navigate 66 years of Nigerian history through critical choices.",
    questionLabel: "Events",
    subjectBased: false,
  },
  "zombie-logic": {
    name: "Zombie Logic Masquerade Exodus",
    icon: Brain,
    color: "#ef4444",
    bg: "#fee2e2",
    category: "logic",
    description: "Deduce zombie traits using logical constraints to survive.",
    questionLabel: "Puzzles",
    subjectBased: false,
  },
};

// ─── CATEGORY CONFIG ─────────────────────────────────────────
export const CATEGORY_CONFIG: Record<GameCategory, { label: string; color: string; bg: string }> = {
  academic: { label: "Academic", color: "#3b82f6", bg: "#dbeafe" },
  puzzle: { label: "Puzzle", color: "#8b5cf6", bg: "#ede9fe" },
  trivia: { label: "Trivia", color: "#f59e0b", bg: "#fef3c7" },
  adventure: { label: "Adventure", color: "#10b981", bg: "#d1fae5" },
  logic: { label: "Logic", color: "#ef4444", bg: "#fee2e2" },
};

// ─── STATUS CONFIG ────────────────────────────────────────────
export const STATUS_CONFIG: Record<GameStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#10b981", bg: "#d1fae5" },
  beta: { label: "Beta", color: "#f97316", bg: "#ffedd5" },
  maintenance: { label: "Maintenance", color: "#ef4444", bg: "#fee2e2" },
  disabled: { label: "Disabled", color: "#6b7280", bg: "#f3f4f6" },
};

// ─── DIFFICULTY CONFIG ────────────────────────────────────────
export const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; bg: string }> = {
  easy: { label: "Easy", color: "#10b981", bg: "#d1fae5" },
  medium: { label: "Medium", color: "#f59e0b", bg: "#fef3c7" },
  hard: { label: "Hard", color: "#f97316", bg: "#ffedd5" },
  expert: { label: "Expert", color: "#ef4444", bg: "#fee2e2" },
};

// ─── MOCK GAMES ───────────────────────────────────────────────
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const MOCK_GAMES: Game[] = (Object.keys(GAME_CONFIGS) as GameSlug[]).map((slug, i) => {
  const cfg = GAME_CONFIGS[slug];
  const plays = rand(1000, 15000);
  return {
    id: `game_${i + 1}`,
    name: cfg.name,
    slug,
    description: cfg.description,
    icon: slug,
    category: cfg.category,
    status: i === 5 ? "beta" : "active",
    totalPlays: plays,
    avgScore: rand(1000, 50000),
    avgTime: rand(120, 900),
    questionsCount: rand(20, 200),
    lastUpdated: new Date(2024, rand(0, 2), rand(1, 28)).toISOString().split("T")[0],
    settings: DEFAULT_SETTINGS[slug],
    completionRate: rand(50, 85),
    weeklyTrend: Array.from({ length: 7 }, () =>
      rand(Math.floor(plays / 30), Math.floor(plays / 10)),
    ),
  };
});

// ─── SUBJECTS FOR SCHOLAR ─────────────────────────────────────
export const SCHOLAR_SUBJECTS = [
  "Chemistry",
  "Mathematics",
  "Physics",
  "Biology",
  "English",
  "Geography",
  "History",
  "Economics",
] as const;

export const ALGEBRA_CLASSES = ["JSS1", "JSS2", "JSS3", "SSS1", "SSS2", "SSS3"] as const;
export const NIGERIAN_ZONES = ["sw", "se", "ss", "nc", "ne", "nw"] as const;

export const WORDCONNECT_SUBJECTS = {
  math: "Mathematics",
  science: "Science",
  english: "English",
  history: "History",
  geo: "Geography",
  tech: "Technology",
} as const;
