import { Game, LeaderboardEntry, PlayerStats, Category, Difficulty } from "@/types/games";

export const GAMES: Game[] = [
  {
    id: "who-wants-to-be-scholar",
    title: "Who Wants to Be a Scholar?",
    description: "Answer 15 escalating questions to claim the ₦1,000,000 prize",
    longDescription:
      "Step into the hot seat! Answer 15 questions of increasing difficulty across all subjects. Use lifelines—Ask the Class, 50/50, or Phone a Friend—to climb the prize ladder. One wrong answer and you fall. Do you have what it takes?",
    emoji: "👑",
    accentColor: "from-amber-400 via-yellow-400 to-orange-500",
    glowColor: "#F59E0B",
    borderColor: "border-amber-500/30",
    players: 12450,
    rating: 4.8,
    ratingCount: 3240,
    duration: "15–30 min",
    difficulty: "Intermediate",
    category: "Quiz",
    tags: ["Quiz", "Trivia", "Prize", "Lifelines"],
    path: "/dashboard/games/who-wants-tobe-a-scholar",
    isPopular: true,
    isFeatured: false,
    achievements: 12,
    xpReward: 500,
    completionRate: 68,
    lastPlayed: "2024-01-18",
  },
  {
    id: "nigerian-trail",
    title: "The Nigerian Trail",
    description: "Navigate 66 years of Nigerian history from independence to now",
    longDescription:
      "Make life-altering decisions through coups, oil booms, SAP, democracy, and modern challenges. Every choice echoes through history — some decisions will haunt you, others will make your family prosper. Can you survive Nigeria's story?",
    emoji: "🗺️",
    accentColor: "from-emerald-400 via-green-400 to-teal-500",
    glowColor: "#10B981",
    borderColor: "border-emerald-500/30",
    players: 8750,
    rating: 4.9,
    ratingCount: 2180,
    duration: "20–40 min",
    difficulty: "Advanced",
    category: "History",
    tags: ["History", "Decisions", "Nigeria", "Strategy"],
    path: "/dashboard/games/nigerian-trail",
    isPopular: true,
    isFeatured: true,
    achievements: 15,
    xpReward: 750,
    completionRate: 54,
    lastPlayed: "2024-01-19",
  },
  {
    id: "where-is-madam-karmen",
    title: "Where Is Madam Karmen?",
    description: "Track the cunning art thief across all 36 states + FCT",
    longDescription:
      "Madam Karmen has stolen the priceless Ife Bronze Head and is on the run! Use clues about culture, cuisine, landmarks, languages, and natural resources to deduce her location in each of Nigeria's 36 states. Beat the clock — she never stays long!",
    emoji: "🔍",
    accentColor: "from-violet-400 via-purple-400 to-fuchsia-500",
    glowColor: "#8B5CF6",
    borderColor: "border-violet-500/30",
    players: 6230,
    rating: 4.7,
    ratingCount: 1540,
    duration: "15–25 min",
    difficulty: "Intermediate",
    category: "Geography",
    tags: ["Geography", "Deduction", "Timer", "Clues"],
    path: "/dashboard/games/madam-karmen",
    isNew: true,
    achievements: 10,
    xpReward: 400,
    completionRate: 72,
  },
  {
    id: "word-connect",
    title: "Word Connect",
    description: "Build words from letter tiles and master subject vocabulary",
    longDescription:
      "Crossword meets Scrabble in this addictive word-building game. Drag and snap letter tiles to form subject-specific vocabulary words. Unlock new tile sets for Math, Science, English Literature, and Social Studies!",
    emoji: "🔤",
    accentColor: "from-sky-400 via-blue-400 to-indigo-500",
    glowColor: "#3B82F6",
    borderColor: "border-sky-500/30",
    players: 15420,
    rating: 4.6,
    ratingCount: 4120,
    duration: "5–15 min",
    difficulty: "Beginner",
    category: "Word",
    tags: ["Word", "Vocabulary", "Puzzle", "Spelling"],
    path: "/dashboard/games/word-connect",
    isPopular: true,
    achievements: 8,
    xpReward: 200,
    completionRate: 88,
    lastPlayed: "2024-01-20",
  },
  {
    id: "zombie-logic",
    title: "Zombie Logic: Masquerade Exodus",
    description: "Guide 16 Igede spirits through logical puzzles to escape the curse",
    longDescription:
      "A jealous sorcerer has cursed the masquerade spirits of the Igede people. Use pure logic — sorting, constraint propagation, and pattern recognition — to guide all 16 spirits safely through the provinces. Every puzzle unlocks ancient Igede lore.",
    emoji: "🎭",
    accentColor: "from-rose-400 via-red-400 to-pink-500",
    glowColor: "#F43F5E",
    borderColor: "border-rose-500/30",
    players: 4320,
    rating: 4.8,
    ratingCount: 980,
    duration: "30–60 min",
    difficulty: "Advanced",
    category: "Logic",
    tags: ["Logic", "Puzzle", "Deduction", "Culture"],
    path: "/dashboard/games/zombie-logic",
    achievements: 18,
    xpReward: 900,
    completionRate: 41,
  },
  {
    id: "algebra-heist",
    title: "Biodun's Algebra Heist",
    description: "Solve equations to help Biodun outrun the monster!",
    longDescription:
      "Each locked door stands between Biodun and freedom — and each door is an algebra equation. Drag number and operation tiles into the correct order to solve and unlock. The monster gets closer with every second you waste!",
    emoji: "🧮",
    accentColor: "from-lime-400 via-green-400 to-emerald-500",
    glowColor: "#84CC16",
    borderColor: "border-lime-500/30",
    players: 9850,
    rating: 4.7,
    ratingCount: 2560,
    duration: "10–20 min",
    difficulty: "Beginner",
    category: "Math",
    tags: ["Math", "Algebra", "Equations", "Escape"],
    path: "/dashboard/games/algebra-heist",
    isPopular: true,
    achievements: 7,
    xpReward: 300,
    completionRate: 81,
    lastPlayed: "2024-01-17",
  },
];

export const LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    username: "ScholarKing01",
    avatar: "SK",
    score: 47800,
    game: "Who Wants to Be a Scholar?",
    badge: "👑",
  },
  {
    rank: 2,
    username: "HistoryBuff_NG",
    avatar: "HB",
    score: 39200,
    game: "The Nigerian Trail",
    badge: "🏆",
  },
  {
    rank: 3,
    username: "GeoMasterX",
    avatar: "GM",
    score: 34500,
    game: "Where Is Madam Karmen?",
    badge: "🥉",
  },
  {
    rank: 4,
    username: "LogicLord99",
    avatar: "LL",
    score: 29100,
    game: "Zombie Logic",
    badge: "⭐",
  },
  {
    rank: 5,
    username: "AlgebraAce",
    avatar: "AA",
    score: 25600,
    game: "Biodun's Algebra Heist",
    badge: "🎯",
  },
  {
    rank: 156,
    username: "You",
    avatar: "ME",
    score: 12450,
    game: "Word Connect",
    badge: "🔤",
    isCurrentUser: true,
  },
];

export const PLAYER_STATS: PlayerStats = {
  totalXP: 4820,
  level: 12,
  gamesPlayed: 34,
  achievementsUnlocked: 23,
  currentStreak: 5,
  rank: 156,
};

export const CATEGORIES: string[] = [
  "All",
  "Quiz",
  "History",
  "Geography",
  "Word",
  "Logic",
  "Math",
  "Strategy",
];

export const DIFFICULTIES: string[] = ["All", "Beginner", "Intermediate", "Advanced", "Expert"];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getDifficultyConfig(difficulty: Difficulty) {
  const map = {
    Beginner: {
      label: "Beginner",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10 border border-emerald-400/20",
      dot: "bg-emerald-400",
    },
    Intermediate: {
      label: "Intermediate",
      color: "text-amber-400",
      bg: "bg-amber-400/10 border border-amber-400/20",
      dot: "bg-amber-400",
    },
    Advanced: {
      label: "Advanced",
      color: "text-orange-400",
      bg: "bg-orange-400/10 border border-orange-400/20",
      dot: "bg-orange-400",
    },
    Expert: {
      label: "Expert",
      color: "text-red-400",
      bg: "bg-red-400/10 border border-red-400/20",
      dot: "bg-red-400",
    },
  };
  return map[difficulty] ?? map.Beginner;
}

export function formatXP(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return String(xp);
}

export function formatPlayers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
