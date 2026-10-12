export type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Expert";
export type Category = "Quiz" | "History" | "Geography" | "Word" | "Logic" | "Math" | "Strategy";

export interface Game {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  emoji: string;               // big visual emoji for the card
  accentColor: string;         // tailwind gradient string
  glowColor: string;           // box-shadow glow color (CSS variable approach)
  borderColor: string;         // border accent
  players: number;
  rating: number;
  ratingCount: number;
  duration: string;
  difficulty: Difficulty;
  category: Category;
  tags: string[];
  path: string;
  isNew?: boolean;
  isPopular?: boolean;
  isFeatured?: boolean;
  achievements: number;
  xpReward: number;            // XP earned on completion
  completionRate: number;      // % of players who complete it
  lastPlayed?: string;         // ISO date string
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  score: number;
  game: string;
  badge: string;
  isCurrentUser?: boolean;
}

export interface PlayerStats {
  totalXP: number;
  level: number;
  gamesPlayed: number;
  achievementsUnlocked: number;
  currentStreak: number;
  rank: number;
}
