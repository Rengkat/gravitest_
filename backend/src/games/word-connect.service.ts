import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WordConnectPuzzle, WordConnectWord } from './entities/word-connect-puzzle.entity';
import {
  WordConnectSession,
  WordConnectSessionStatus,
} from './entities/word-connect-session.entity';
import { StudentsService } from 'src/students/students.service';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { SubscriptionTier } from 'src/common/enums/enums';

export const WC_LIVES_PER_LEVEL = 3;
export const WC_BASE_REWARD = 500;
export const WC_PERFECT_BONUS = 200; // still on full lives when solved
const INCENTIVE_ELIGIBLE_TIERS = new Set([
  SubscriptionTier.BASIC,
  SubscriptionTier.STANDARD,
  SubscriptionTier.PREMIUM,
  SubscriptionTier.ENTERPRISE,
]);

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// What the client is allowed to know about a word before solving it:
// where it sits on the grid, how long it is, and its clue — but never
// the letters. The board renders empty cells from row/col/length/dir.
export interface SafeWord {
  index: number;
  dir: 'h' | 'v';
  row: number;
  col: number;
  length: number;
  clue: string;
  solved: boolean;
  // Only populated once solved (or revealed on life-loss) — that's when
  // the prototype shows the letters on the board anyway.
  letters?: string;
}
export interface SafeLevel {
  levelNumber: number;
  totalLevels: number;
  subjectKey: string;
  subjectName: string;
  words: SafeWord[];
  // Shuffled letter tiles for the currently-active word, including
  // decoys — generated server-side so the tile set can't be mined for
  // the answer any more than the prototype's own version could.
  tiles: string[];
  activeWordIndex: number;
  lives: number;
  cash: number;
}

@Injectable()
export class WordConnectService {
  constructor(
    @InjectRepository(WordConnectPuzzle)
    private readonly puzzleRepo: Repository<WordConnectPuzzle>,
    @InjectRepository(WordConnectSession)
    private readonly sessionRepo: Repository<WordConnectSession>,
    private readonly studentsService: StudentsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // ── SUBJECTS ────────────────────────────────────────────
  async getSubjects() {
    const rows = await this.puzzleRepo
      .createQueryBuilder('p')
      .select('p.subjectKey', 'subjectKey')
      .addSelect('MIN(p.subjectName)', 'subjectName')
      .addSelect('MIN(p.icon)', 'icon')
      .addSelect('MIN(p.color)', 'color')
      .addSelect('COUNT(*)', 'puzzleCount')
      .where('p.isActive = true')
      .groupBy('p.subjectKey')
      .getRawMany();

    return rows.map((r) => ({
      subjectKey: r.subjectKey,
      subjectName: r.subjectName,
      icon: r.icon,
      color: r.color,
      puzzleCount: parseInt(r.puzzleCount, 10),
    }));
  }

  // ── START ───────────────────────────────────────────────
  async startSession(userId: string, subjectKey: string) {
    await this.sessionRepo.update(
      { userId, status: WordConnectSessionStatus.IN_PROGRESS },
      { status: WordConnectSessionStatus.QUIT, endedAt: new Date() },
    );

    const puzzles = await this.puzzleRepo.find({ where: { subjectKey, isActive: true } });
    if (!puzzles.length) {
      throw new BadRequestException('No puzzles available for that subject yet.');
    }

    const session = this.sessionRepo.create({
      userId,
      subjectKey,
      status: WordConnectSessionStatus.IN_PROGRESS,
      puzzleSequence: shuffle(puzzles).map((p) => p.id),
      currentIndex: 0,
      solvedWords: [],
      lives: WC_LIVES_PER_LEVEL,
      cash: 0,
      totalWordsSolved: 0,
      xpEarned: 0,
    });
    const saved = await this.sessionRepo.save(session);
    const level = await this.buildLevel(saved);
    return { sessionId: saved.id, level };
  }

  // ── SUBMIT A WORD GUESS ─────────────────────────────────
  async submitWord(userId: string, sessionId: string, wordIndex: number, guess: string) {
    const session = await this.getOwnedInProgressSession(userId, sessionId);
    const puzzle = await this.getCurrentPuzzle(session);
    const target = puzzle.words[wordIndex];
    if (!target) throw new BadRequestException('No such word in this puzzle.');
    if (session.solvedWords.includes(target.word)) {
      throw new BadRequestException('That word is already solved.');
    }

    const isCorrect = guess.trim().toUpperCase() === target.word.toUpperCase();
    let earned = 0;
    let levelComplete = false;
    let revealedWord: string | undefined;

    if (isCorrect) {
      earned = WC_BASE_REWARD + (session.lives === WC_LIVES_PER_LEVEL ? WC_PERFECT_BONUS : 0);
      session.cash += earned;
      session.solvedWords = [...session.solvedWords, target.word];
      session.totalWordsSolved += 1;
      levelComplete = session.solvedWords.length >= puzzle.words.length;
    } else {
      session.lives -= 1;
      if (session.lives <= 0) {
        // Out of lives: reveal this word and move the level along, same
        // as the prototype does.
        revealedWord = target.word;
        session.solvedWords = [...session.solvedWords, target.word];
        levelComplete = true;
      }
    }

    let nextLevel: SafeLevel | null = null;
    let sessionFinished = false;

    if (levelComplete) {
      session.currentIndex += 1;
      session.lives = WC_LIVES_PER_LEVEL;
      session.solvedWords = [];
      if (session.currentIndex >= session.puzzleSequence.length) {
        await this.finishSession(session, WordConnectSessionStatus.COMPLETED);
        sessionFinished = true;
      } else {
        await this.sessionRepo.save(session);
        nextLevel = await this.buildLevel(session);
      }
    } else {
      await this.sessionRepo.save(session);
    }

    return {
      isCorrect,
      earned,
      revealedWord,
      cash: session.cash,
      lives: session.lives,
      levelComplete,
      sessionFinished,
      nextLevel,
      // Once the level is over the whole solution is fair to send — the
      // prototype fills the board in at exactly this moment.
      solution: levelComplete ? puzzle.words.map((w) => w.word) : undefined,
      currentLevel: sessionFinished ? null : await this.maybeCurrentLevel(session, levelComplete, nextLevel),
      xpEarned: sessionFinished ? session.xpEarned : undefined,
    };
  }

  // Re-serve the current level (same puzzle, updated state) when the
  // level didn't complete — lets the client resync tiles for the next
  // unsolved word without guessing at ordering itself.
  private async maybeCurrentLevel(
    session: WordConnectSession,
    levelComplete: boolean,
    nextLevel: SafeLevel | null,
  ): Promise<SafeLevel | null> {
    if (levelComplete) return nextLevel;
    return this.buildLevel(session);
  }

  // ── QUIT ────────────────────────────────────────────────
  async quitSession(userId: string, sessionId: string) {
    const session = await this.getOwnedInProgressSession(userId, sessionId);
    await this.finishSession(session, WordConnectSessionStatus.QUIT);
    return { cash: session.cash, xpEarned: session.xpEarned };
  }

  // ── STATS + LEADERBOARD ─────────────────────────────────
  async getMyStats(userId: string) {
    const best = await this.sessionRepo
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .andWhere('s.status != :ip', { ip: WordConnectSessionStatus.IN_PROGRESS })
      .orderBy('s.cash', 'DESC')
      .getOne();
    const gamesPlayed = await this.sessionRepo.count({ where: { userId } });
    return { highScore: best?.cash ?? 0, gamesPlayed };
  }

  async getMonthlyLeaderboard(params: { page: number; limit: number; currentUserId?: string }) {
    const { page, limit, currentUserId } = params;
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const periodResetsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const qb = () =>
      this.sessionRepo
        .createQueryBuilder('s')
        .innerJoin('users', 'u', 'u.id = s.userId')
        .where('s.createdAt >= :monthStart', { monthStart })
        .andWhere('s.status != :ip', { ip: WordConnectSessionStatus.IN_PROGRESS })
        .groupBy('s.userId')
        .addGroupBy('u.firstName')
        .addGroupBy('u.lastName')
        .addGroupBy('u.avatarUrl')
        .select('s.userId', 'userId')
        .addSelect('MAX(s.cash)', 'bestScore')
        .addSelect('SUM(s.totalWordsSolved)', 'wordsSolved')
        .addSelect('COUNT(*)', 'gamesPlayed')
        .addSelect('u.firstName', 'firstName')
        .addSelect('u.lastName', 'lastName')
        .addSelect('u.avatarUrl', 'avatarUrl')
        .orderBy('"bestScore"', 'DESC');

    const totalRow = await qb().select('COUNT(DISTINCT s.userId)', 'count').getRawOne();
    const total = parseInt(totalRow?.count ?? '0', 10);
    const rows = await qb().offset((page - 1) * limit).limit(limit).getRawMany();

    const eligibility = new Map<string, boolean>();
    await Promise.all(
      rows.map(async (r) => {
        const sub = await this.subscriptionsService.getCurrentSubscription(r.userId);
        eligibility.set(r.userId, !!sub && sub.isActive() && INCENTIVE_ELIGIBLE_TIERS.has(sub.tier));
      }),
    );

    return {
      entries: rows.map((r, idx) => ({
        rank: (page - 1) * limit + idx + 1,
        userId: r.userId,
        name: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim(),
        avatarUrl: r.avatarUrl ?? null,
        bestScore: parseInt(r.bestScore, 10) || 0,
        wordsSolved: parseInt(r.wordsSolved, 10) || 0,
        gamesPlayed: parseInt(r.gamesPlayed, 10) || 0,
        incentiveEligible: eligibility.get(r.userId) ?? false,
        isCurrentUser: r.userId === currentUserId,
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      periodResetsAt,
    };
  }

  // ── PRIVATE ─────────────────────────────────────────────

  private async getCurrentPuzzle(session: WordConnectSession): Promise<WordConnectPuzzle> {
    const id = session.puzzleSequence[session.currentIndex];
    const puzzle = await this.puzzleRepo.findOne({ where: { id } });
    if (!puzzle) throw new NotFoundException('Puzzle not found.');
    return puzzle;
  }

  private async buildLevel(session: WordConnectSession): Promise<SafeLevel> {
    const puzzle = await this.getCurrentPuzzle(session);
    const activeIndex = puzzle.words.findIndex((w) => !session.solvedWords.includes(w.word));
    const activeWord = activeIndex >= 0 ? puzzle.words[activeIndex] : null;

    return {
      levelNumber: session.currentIndex + 1,
      totalLevels: session.puzzleSequence.length,
      subjectKey: puzzle.subjectKey,
      subjectName: puzzle.subjectName,
      words: puzzle.words.map((w, i) => {
        const solved = session.solvedWords.includes(w.word);
        const safe: SafeWord = {
          index: i,
          dir: w.dir,
          row: w.row,
          col: w.col,
          length: w.word.length,
          clue: w.clue,
          solved,
        };
        if (solved) safe.letters = w.word;
        return safe;
      }),
      tiles: activeWord ? this.buildTiles(activeWord) : [],
      activeWordIndex: activeIndex,
      lives: session.lives,
      cash: session.cash,
    };
  }

  // Mirrors the prototype's tile generation: the real letters plus
  // enough random decoys to reach ~14 tiles, all shuffled.
  private buildTiles(word: WordConnectWord): string[] {
    const letters = word.word.toUpperCase().split('');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const decoyPool = shuffle(alphabet.filter((l) => !letters.includes(l)));
    const decoyCount = Math.max(5, 14 - letters.length);
    return shuffle([...letters, ...decoyPool.slice(0, decoyCount)]);
  }

  private async getOwnedInProgressSession(
    userId: string,
    sessionId: string,
  ): Promise<WordConnectSession> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Game session not found.');
    if (session.userId !== userId) throw new ForbiddenException('This is not your game session.');
    if (session.status !== WordConnectSessionStatus.IN_PROGRESS) {
      throw new BadRequestException('This game session has already ended.');
    }
    return session;
  }

  private async finishSession(
    session: WordConnectSession,
    status: WordConnectSessionStatus,
  ): Promise<void> {
    session.status = status;
    session.endedAt = new Date();
    // Same scaling convention as the other games — keeps game XP sane
    // next to exam-session XP. ~₦500/word means 1 XP per 100 cash.
    session.xpEarned = Math.max(5, Math.round(session.cash / 100));
    await this.sessionRepo.save(session);

    try {
      const profile = await this.studentsService.findByUserId(session.userId);
      await this.studentsService.awardXp({
        studentProfileId: profile.id,
        xp: session.xpEarned,
        reason: 'game_word_connect',
      });
    } catch {
      // No profile — never block the result over it.
    }
  }
}
