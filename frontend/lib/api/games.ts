import { apiClient } from "./client";

export interface GameOption {
  label: string;
  text: string;
  imageUrl: string | null;
}
export interface GamePassage {
  title: string | null;
  instructions: string | null;
  passageText: string | null;
  passageImageUrl: string | null;
}
export interface GameQuestion {
  id: string;
  text: string;
  imageUrl: string | null;
  options: GameOption[];
  passage: GamePassage | null;
}

export interface ScholarSubject {
  subject: string;
  questionCount: number;
}

export async function getScholarSubjects(): Promise<ScholarSubject[]> {
  const { data } = await apiClient.get("/games/scholar/subjects");
  return data;
}

export interface StartSessionResponse {
  sessionId: string;
  subject: string;
  questions: GameQuestion[];
}

export async function startScholarSession(subject: string): Promise<StartSessionResponse> {
  const { data } = await apiClient.post("/games/scholar/start", { subject });
  return data;
}

export interface AnswerResponse {
  isCorrect: boolean;
  correctLabel: string | null;
  prizeWon: number;
  isMilestone: boolean;
  sessionStatus: "in_progress" | "won" | "lost" | "quit";
  nextQuestionIndex: number | null;
  xpEarned?: number;
}

export async function submitScholarAnswer(
  sessionId: string,
  questionId: string,
  selectedLabel: string,
): Promise<AnswerResponse> {
  const { data } = await apiClient.post("/games/scholar/answer", {
    sessionId,
    questionId,
    selectedLabel,
  });
  return data;
}

export interface LifelineResponse {
  removedLabels?: string[];
  nextQuestionIndex?: number | null;
  sessionStatus?: string;
}

export async function useScholarLifeline(
  sessionId: string,
  lifeline: "ll50" | "skip",
): Promise<LifelineResponse> {
  const { data } = await apiClient.post("/games/scholar/lifeline", { sessionId, lifeline });
  return data;
}

export async function quitScholarSession(
  sessionId: string,
): Promise<{ prizeWon: number; xpEarned: number }> {
  const { data } = await apiClient.post("/games/scholar/quit", { sessionId });
  return data;
}

export async function getMyScholarStats(): Promise<{ highestScore: number; gamesPlayed: number }> {
  const { data } = await apiClient.get("/games/scholar/me/stats");
  return data;
}

export interface ScholarLeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  bestPrize: number;
  totalXp: number;
  gamesPlayed: number;
  incentiveEligible: boolean;
  isCurrentUser: boolean;
}
export interface ScholarLeaderboardResult {
  entries: ScholarLeaderboardEntry[];
  currentUserEntry: ScholarLeaderboardEntry | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  periodResetsAt: string;
}

export async function getScholarMonthlyLeaderboard(params?: {
  page?: number;
  limit?: number;
}): Promise<ScholarLeaderboardResult> {
  const { data } = await apiClient.get("/games/scholar/leaderboard/monthly", { params });
  return data;
}

// ═══════════════════════════════════════════════════════════════
// WHERE IN NIGERIA IS MADAM KARMEN?
// ═══════════════════════════════════════════════════════════════

export interface KarmenCaseChoice {
  id: string;
  name: string;
  zone: string;
}
export interface KarmenRound {
  caseNumber: number;
  zone: string;
  clueText: string;
  choices: KarmenCaseChoice[];
  timerSeconds: number;
  leads: number;
  hintsLeft: number;
  streak: number;
  score: number;
}

export async function startKarmenSession(): Promise<{ sessionId: string; round: KarmenRound }> {
  const { data } = await apiClient.post("/games/karmen/start");
  return data;
}

export interface KarmenAnswerResponse {
  isCorrect: boolean;
  correctCaseName: string | null;
  correctCaseZone: string | null;
  pointsChange: number;
  bonusStreak: boolean;
  score: number;
  leads: number;
  streak: number;
  sessionStatus: "in_progress" | "won" | "lost" | "quit";
  interrogationReady: boolean;
  nextRound: KarmenRound | null;
  xpEarned?: number;
}

export async function submitKarmenAnswer(
  sessionId: string,
  chosenCaseId: string,
  secondsLeft: number,
): Promise<KarmenAnswerResponse> {
  const { data } = await apiClient.post("/games/karmen/answer", { sessionId, chosenCaseId, secondsLeft });
  return data;
}

export interface KarmenSkipResponse {
  score: number;
  sessionStatus: string;
  nextRound: KarmenRound | null;
  xpEarned?: number;
}
export async function skipKarmenClue(sessionId: string): Promise<KarmenSkipResponse> {
  const { data } = await apiClient.post("/games/karmen/skip", { sessionId });
  return data;
}

export async function useKarmenHint(sessionId: string): Promise<{ hint: string; hintsLeft: number }> {
  const { data } = await apiClient.post("/games/karmen/hint", { sessionId });
  return data;
}

export interface KarmenInterrogation {
  question: string;
  options: string[];
  witnessName: string;
  witnessRole: string;
}
export async function getKarmenInterrogation(sessionId: string): Promise<KarmenInterrogation> {
  const { data } = await apiClient.get("/games/karmen/interrogation", { params: { sessionId } });
  return data;
}
export async function answerKarmenInterrogation(
  sessionId: string,
  selectedIndex: number,
): Promise<{ isCorrect: boolean; correctIndex: number; hintsLeft: number }> {
  const { data } = await apiClient.post("/games/karmen/interrogation/answer", { sessionId, selectedIndex });
  return data;
}

export async function quitKarmenSession(sessionId: string): Promise<{ score: number; xpEarned: number }> {
  const { data } = await apiClient.post("/games/karmen/quit", { sessionId });
  return data;
}

export async function getMyKarmenStats(): Promise<{ highScore: number; gamesPlayed: number }> {
  const { data } = await apiClient.get("/games/karmen/me/stats");
  return data;
}

export interface KarmenLeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  bestScore: number;
  gamesPlayed: number;
  incentiveEligible: boolean;
  isCurrentUser: boolean;
}
export interface KarmenLeaderboardResult {
  entries: KarmenLeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  periodResetsAt: string;
}
export async function getKarmenMonthlyLeaderboard(params?: {
  page?: number;
  limit?: number;
}): Promise<KarmenLeaderboardResult> {
  const { data } = await apiClient.get("/games/karmen/leaderboard/monthly", { params });
  return data;
}

// ═══════════════════════════════════════════════════════════════
// WORD CONNECT
// ═══════════════════════════════════════════════════════════════

export interface WordConnectSubject {
  subjectKey: string;
  subjectName: string;
  icon: string;
  color: string;
  puzzleCount: number;
}

export interface WordConnectSafeWord {
  index: number;
  dir: "h" | "v";
  row: number;
  col: number;
  length: number;
  clue: string;
  solved: boolean;
  letters?: string;
}

export interface WordConnectLevel {
  levelNumber: number;
  totalLevels: number;
  subjectKey: string;
  subjectName: string;
  words: WordConnectSafeWord[];
  tiles: string[];
  activeWordIndex: number;
  lives: number;
  cash: number;
}

export async function getWordConnectSubjects(): Promise<WordConnectSubject[]> {
  const { data } = await apiClient.get("/games/word-connect/subjects");
  return data;
}

export async function startWordConnectSession(
  subjectKey: string,
): Promise<{ sessionId: string; level: WordConnectLevel }> {
  const { data } = await apiClient.post("/games/word-connect/start", { subjectKey });
  return data;
}

export interface WordConnectSubmitResponse {
  isCorrect: boolean;
  earned: number;
  revealedWord?: string;
  cash: number;
  lives: number;
  levelComplete: boolean;
  sessionFinished: boolean;
  nextLevel: WordConnectLevel | null;
  solution?: string[];
  currentLevel: WordConnectLevel | null;
  xpEarned?: number;
}

export async function submitWordConnectWord(
  sessionId: string,
  wordIndex: number,
  guess: string,
): Promise<WordConnectSubmitResponse> {
  const { data } = await apiClient.post("/games/word-connect/word", { sessionId, wordIndex, guess });
  return data;
}

export async function quitWordConnectSession(
  sessionId: string,
): Promise<{ cash: number; xpEarned: number }> {
  const { data } = await apiClient.post("/games/word-connect/quit", { sessionId });
  return data;
}

export async function getMyWordConnectStats(): Promise<{ highScore: number; gamesPlayed: number }> {
  const { data } = await apiClient.get("/games/word-connect/me/stats");
  return data;
}

export interface WordConnectLeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  bestScore: number;
  wordsSolved: number;
  gamesPlayed: number;
  incentiveEligible: boolean;
  isCurrentUser: boolean;
}
export interface WordConnectLeaderboardResult {
  entries: WordConnectLeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  periodResetsAt: string;
}
export async function getWordConnectMonthlyLeaderboard(params?: {
  page?: number;
  limit?: number;
}): Promise<WordConnectLeaderboardResult> {
  const { data } = await apiClient.get("/games/word-connect/leaderboard/monthly", { params });
  return data;
}
