// ─── GAME IDENTITY ───────────────────────────────────────────
export type GameSlug =
  | "scholar" // Who Wants to Be a Scholar (Millionaire)
  | "word-connect" // Word Connect Puzzle
  | "madam-karmen" // Where in Nigeria is Madam Karmen
  | "algebra-heist" // Biodun's Algebra Heist
  | "nigerian-trail" // The Nigerian Trail
  | "zombie-logic"; // Zombie Logic Masquerade Exodus

export type GameCategory = "academic" | "puzzle" | "trivia" | "adventure" | "logic";
export type GameStatus = "active" | "maintenance" | "beta" | "disabled";
export type Difficulty = "easy" | "medium" | "hard" | "expert";
export type ViewMode = "overview" | "questions" | "settings" | "analytics";

// ─── GAME SETTINGS ───────────────────────────────────────────
export interface GameSettings {
  difficultyLevels: Difficulty[];
  timeLimit: number; // seconds (0 = unlimited)
  lives: number;
  hintsEnabled: boolean;
  leaderboardEnabled: boolean;
  dailyChallenges: boolean;
  maxQuestions: number;
  scoring: {
    basePoints: number;
    timeBonus: boolean;
    streakBonus: boolean;
    streakMultiplier: number;
  };
}

// ─── QUESTION SCHEMAS PER GAME ───────────────────────────────

/** Scholar (Millionaire): {q, o[4], a(index), subject, difficulty} */
export interface ScholarQuestion {
  id: string;
  subject:
    | "Chemistry"
    | "Mathematics"
    | "Physics"
    | "Biology"
    | "English"
    | "Geography"
    | "History"
    | "Economics";
  q: string; // question text
  o: [string, string, string, string]; // options A–D
  a: 0 | 1 | 2 | 3; // correct option index
  difficulty: Difficulty;
  explanation?: string;
  examRef?: string; // e.g. "WAEC 2019"
  stats?: QuestionStats;
}

/** Algebra Heist: {e, c[], d[], classLevel, roomLevel, subject} */
export interface AlgebraQuestion {
  id: string;
  classLevel: "JSS1" | "JSS2" | "JSS3" | "SSS1" | "SSS2" | "SSS3";
  roomLevel: 1 | 2; // room 1 (easier) or room 2 (harder)
  e: string; // equation e.g. "2x + 3 = 9"
  c: string[]; // correct steps (can be multiple drag steps)
  d: string[]; // distractors
  difficulty: Difficulty;
  stats?: QuestionStats;
}

/** Word Connect: {w, dir, r, c, clue, subject} — a word in a crossword puzzle */
export interface WordConnectWord {
  id: string;
  subject: "math" | "science" | "english" | "history" | "geo" | "tech";
  w: string; // the word (uppercase)
  clue: string; // definition/clue shown to player
  tags: string[]; // topic tags
}

/** Word Connect Puzzle: a set of intersecting words on the board */
export interface WordConnectPuzzle {
  id: string;
  subject: string;
  name: string;
  words: {
    wordId: string;
    w: string;
    dir: "h" | "v";
    r: number;
    c: number;
    clue: string;
  }[];
  difficulty: Difficulty;
  gridSize: number;
  stats?: QuestionStats;
}

/** Madam Karmen: a Nigerian state's clue set */
export interface KarmenLocation {
  id: string;
  name: string; // e.g. "Lagos"
  capital: string;
  zone: "sw" | "se" | "ss" | "nc" | "ne" | "nw";
  slogan: string;
  minerals: string;
  notable: string;
  clueCulture: string;
  clueFood: string;
  clueNature: string;
  clueLandmark: string;
  artifact: string;
  difficulty: Difficulty;
  stats?: QuestionStats;
}

/** Nigerian Trail: a historical event with choices */
export interface TrailEvent {
  id: string;
  year: number;
  month: number;
  title: string;
  category: string; // e.g. "Political Milestone"
  severity: "positive" | "negative" | "neutral";
  zone: string;
  text: string; // narrative paragraph
  choices?: {
    text: string;
    outcome: string;
    score: number;
  }[];
  difficulty: Difficulty;
  stats?: QuestionStats;
}

/** Zombie Logic: a logic puzzle constraint set */
export interface ZombieLogicPuzzle {
  id: string;
  name: string;
  level: number;
  difficulty: Difficulty;
  traitCount: number; // how many zombie traits to deduce
  clues: string[]; // text descriptions of constraints
  solution: Record<string, string>;
  stats?: QuestionStats;
}

/** Union of all question types */
export type AnyQuestion =
  | ScholarQuestion
  | AlgebraQuestion
  | WordConnectPuzzle
  | KarmenLocation
  | TrailEvent
  | ZombieLogicPuzzle;

// ─── STATS ───────────────────────────────────────────────────
export interface QuestionStats {
  timesAnswered: number;
  timesCorrect: number;
  avgTime: number;
  skips: number;
}

// ─── GAME ENTITY ─────────────────────────────────────────────
export interface Game {
  id: string;
  name: string;
  slug: GameSlug;
  description: string;
  icon: string;
  category: GameCategory;
  status: GameStatus;
  totalPlays: number;
  avgScore: number;
  avgTime: number; // seconds
  questionsCount: number;
  lastUpdated: string;
  settings: GameSettings;
  completionRate: number; // 0–100
  weeklyTrend: number[]; // 7 values, plays per day
}

// ─── GAME ANALYTICS ──────────────────────────────────────────
export interface GameAnalytics {
  gameId: string;
  totalPlays: number;
  uniquePlayers: number;
  avgScore: number;
  completionRate: number;
  avgSessionTime: number;
  playsThisWeek: number[];
  playsThisMonth: number[];
  difficultyBreakdown: { level: Difficulty; successRate: number; attempts: number }[];
  topSubjects: { name: string; plays: number; avgScore: number }[];
  playerRetention: number;
}

// ─── FILTERS ─────────────────────────────────────────────────
export interface GameFilters {
  category: GameCategory | "";
  status: GameStatus | "";
  search: string;
}
