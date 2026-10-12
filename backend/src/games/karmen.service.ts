import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KarmenCase } from './entities/karmen-case.entity';
import { KarmenInterrogationQuestion } from './entities/karmen-interrogation.entity';
import {
  KarmenClueState,
  KarmenSession,
  KarmenSessionStatus,
} from './entities/karmen-session.entity';
import { StudentsService } from 'src/students/students.service';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { SubscriptionTier } from 'src/common/enums/enums';

export const KARMEN_GAME_LENGTH = 10;
export const KARMEN_START_LEADS = 3;
export const KARMEN_START_HINTS = 3;
export const KARMEN_TIMER_SECONDS = 30;
const CLUE_FIELDS: KarmenClueState['clueField'][] = [
  'clueCulture',
  'clueFood',
  'clueLandmark',
  'clueLanguage',
  'clueMineral',
];
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

export interface SafeKarmenCase {
  id: string;
  name: string;
  zone: string;
}
export interface SafeKarmenRound {
  caseNumber: number; // 1-indexed, for display
  // The correct case's zone — intentionally revealed up front, matching
  // the prototype's own "Reports place her somewhere in this zone"
  // framing before the choice grid appears. A zone spans several
  // states, so this narrows without ever naming the answer.
  zone: string;
  clueText: string;
  choices: SafeKarmenCase[]; // 4, shuffled — no indication which is correct
  timerSeconds: number;
  leads: number;
  hintsLeft: number;
  streak: number;
  score: number;
}

@Injectable()
export class KarmenService {
  constructor(
    @InjectRepository(KarmenCase)
    private readonly caseRepo: Repository<KarmenCase>,
    @InjectRepository(KarmenInterrogationQuestion)
    private readonly interrogationRepo: Repository<KarmenInterrogationQuestion>,
    @InjectRepository(KarmenSession)
    private readonly sessionRepo: Repository<KarmenSession>,
    private readonly studentsService: StudentsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // ═══════════════════════════════════════════════════════
  // START — fresh random draw of 10 cases from the full admin-managed
  // pool every single game (real anti-cramming, not a fixed sequence).
  // ═══════════════════════════════════════════════════════
  async startSession(userId: string): Promise<{ sessionId: string; round: SafeKarmenRound }> {
    await this.sessionRepo.update(
      { userId, status: KarmenSessionStatus.IN_PROGRESS },
      { status: KarmenSessionStatus.QUIT, endedAt: new Date() },
    );

    const allCases = await this.caseRepo.find({ where: { isActive: true } });
    if (allCases.length < KARMEN_GAME_LENGTH) {
      throw new BadRequestException(
        'Not enough Madam Karmen cases available yet — check back soon.',
      );
    }

    const caseSequence = shuffle(allCases)
      .slice(0, KARMEN_GAME_LENGTH)
      .map((c) => c.id);

    const session = this.sessionRepo.create({
      userId,
      status: KarmenSessionStatus.IN_PROGRESS,
      caseSequence,
      currentIndex: 0,
      score: 0,
      leads: KARMEN_START_LEADS,
      streak: 0,
      hintsLeft: KARMEN_START_HINTS,
      interrogationsUsed: 0,
      interrogationReady: false,
      pendingInterrogationId: null,
      achievements: [],
      xpEarned: 0,
    });
    const saved = await this.sessionRepo.save(session);

    const round = await this.buildRound(saved, allCases);
    saved.currentClue = round.clueState;
    await this.sessionRepo.save(saved);

    return { sessionId: saved.id, round: round.safeRound };
  }

  // ═══════════════════════════════════════════════════════
  // SUBMIT ANSWER
  // ═══════════════════════════════════════════════════════
  async submitAnswer(userId: string, sessionId: string, chosenCaseId: string, secondsLeft: number) {
    const session = await this.getOwnedInProgressSession(userId, sessionId);
    const correctCaseId = session.caseSequence[session.currentIndex];
    const isCorrect = chosenCaseId === correctCaseId;
    const clampedSecondsLeft = Math.max(0, Math.min(KARMEN_TIMER_SECONDS, secondsLeft));

    let pointsChange = 0;
    let bonusStreak = false;

    if (isCorrect) {
      session.streak += 1;
      pointsChange = 100 + clampedSecondsLeft * 3;
      if (session.streak > 0 && session.streak % 3 === 0) {
        pointsChange += 300;
        bonusStreak = true;
      }
      // Every 3rd *consecutive correct* solve unlocks an interrogation
      // opportunity (streak already reflects this answer, having just
      // been incremented above).
      if (session.streak > 0 && session.streak % 3 === 0) {
        const q = await this.pickRandomInterrogation();
        if (q) {
          session.interrogationReady = true;
          session.pendingInterrogationId = q.id;
        }
      }
    } else {
      session.streak = 0;
      pointsChange = -50;
      session.leads -= 1;
    }

    session.score = Math.max(0, session.score + pointsChange);

    const correctCase = await this.caseRepo.findOne({ where: { id: correctCaseId } });
    const gameOver = session.leads <= 0;
    const allCasesDone = session.currentIndex + 1 >= KARMEN_GAME_LENGTH;

    let nextRound: SafeKarmenRound | null = null;
    if (gameOver) {
      await this.finishSession(session, KarmenSessionStatus.LOST);
    } else if (allCasesDone) {
      await this.finishSession(session, KarmenSessionStatus.WON);
    } else {
      session.currentIndex += 1;
      const allCases = await this.caseRepo.find({ where: { isActive: true } });
      const round = await this.buildRound(session, allCases);
      session.currentClue = round.clueState;
      nextRound = round.safeRound;
      await this.sessionRepo.save(session);
    }

    return {
      isCorrect,
      correctCaseName: correctCase?.name ?? null,
      correctCaseZone: correctCase?.zone ?? null,
      pointsChange,
      bonusStreak,
      score: session.score,
      leads: session.leads,
      streak: session.streak,
      sessionStatus: session.status,
      interrogationReady: session.interrogationReady,
      nextRound,
      xpEarned: session.status !== KarmenSessionStatus.IN_PROGRESS ? session.xpEarned : undefined,
    };
  }

  // ═══════════════════════════════════════════════════════
  // SKIP — small penalty, no life lost, moves on immediately
  // ═══════════════════════════════════════════════════════
  async skipClue(userId: string, sessionId: string) {
    const session = await this.getOwnedInProgressSession(userId, sessionId);
    session.streak = 0;
    session.score = Math.max(0, session.score - 25);

    const allCasesDone = session.currentIndex + 1 >= KARMEN_GAME_LENGTH;
    let nextRound: SafeKarmenRound | null = null;
    if (allCasesDone) {
      await this.finishSession(session, KarmenSessionStatus.WON);
    } else {
      session.currentIndex += 1;
      const allCases = await this.caseRepo.find({ where: { isActive: true } });
      const round = await this.buildRound(session, allCases);
      session.currentClue = round.clueState;
      nextRound = round.safeRound;
      await this.sessionRepo.save(session);
    }

    return {
      score: session.score,
      sessionStatus: session.status,
      nextRound,
      xpEarned: session.status !== KarmenSessionStatus.IN_PROGRESS ? session.xpEarned : undefined,
    };
  }

  // ═══════════════════════════════════════════════════════
  // HINT — reveals the current case's extraHint text
  // ═══════════════════════════════════════════════════════
  async useHint(userId: string, sessionId: string): Promise<{ hint: string; hintsLeft: number }> {
    const session = await this.getOwnedInProgressSession(userId, sessionId);
    if (session.hintsLeft <= 0) {
      throw new BadRequestException('No hints left this game.');
    }
    const correctCaseId = session.caseSequence[session.currentIndex];
    const correctCase = await this.caseRepo.findOne({ where: { id: correctCaseId } });
    if (!correctCase) throw new NotFoundException('Case not found.');

    session.hintsLeft -= 1;
    await this.sessionRepo.save(session);
    return { hint: correctCase.extraHint, hintsLeft: session.hintsLeft };
  }

  // ═══════════════════════════════════════════════════════
  // INTERROGATION — answering right earns a free extra hint
  // ═══════════════════════════════════════════════════════
  async getPendingInterrogation(userId: string, sessionId: string) {
    const session = await this.getOwnedInProgressSession(userId, sessionId);
    if (!session.interrogationReady || !session.pendingInterrogationId) {
      throw new BadRequestException('No interrogation available right now.');
    }
    const q = await this.interrogationRepo.findOne({ where: { id: session.pendingInterrogationId } });
    if (!q) throw new NotFoundException('Interrogation question not found.');
    return {
      question: q.question,
      options: q.options,
      witnessName: q.witnessName,
      witnessRole: q.witnessRole,
    };
  }

  async answerInterrogation(userId: string, sessionId: string, selectedIndex: number) {
    const session = await this.getOwnedInProgressSession(userId, sessionId);
    if (!session.interrogationReady || !session.pendingInterrogationId) {
      throw new BadRequestException('No interrogation available right now.');
    }
    const q = await this.interrogationRepo.findOne({ where: { id: session.pendingInterrogationId } });
    if (!q) throw new NotFoundException('Interrogation question not found.');

    const isCorrect = selectedIndex === q.correctIndex;
    if (isCorrect) session.hintsLeft += 1;

    session.interrogationReady = false;
    session.pendingInterrogationId = null;
    session.interrogationsUsed += 1;
    await this.sessionRepo.save(session);

    return { isCorrect, correctIndex: q.correctIndex, hintsLeft: session.hintsLeft };
  }

  // ═══════════════════════════════════════════════════════
  // QUIT
  // ═══════════════════════════════════════════════════════
  async quitSession(userId: string, sessionId: string) {
    const session = await this.getOwnedInProgressSession(userId, sessionId);
    await this.finishSession(session, KarmenSessionStatus.QUIT);
    return { score: session.score, xpEarned: session.xpEarned };
  }

  // ═══════════════════════════════════════════════════════
  // STATS + LEADERBOARD — same shape/conventions as the Scholar game
  // ═══════════════════════════════════════════════════════
  async getMyStats(userId: string) {
    const best = await this.sessionRepo
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .andWhere('s.status != :inProgress', { inProgress: KarmenSessionStatus.IN_PROGRESS })
      .orderBy('s.score', 'DESC')
      .getOne();
    const gamesPlayed = await this.sessionRepo.count({ where: { userId } });
    return { highScore: best?.score ?? 0, gamesPlayed };
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
        .andWhere('s.status != :inProgress', { inProgress: KarmenSessionStatus.IN_PROGRESS })
        .groupBy('s.userId')
        .addGroupBy('u.firstName')
        .addGroupBy('u.lastName')
        .addGroupBy('u.avatarUrl')
        .select('s.userId', 'userId')
        .addSelect('MAX(s.score)', 'bestScore')
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

    const entries = rows.map((r, idx) => ({
      rank: (page - 1) * limit + idx + 1,
      userId: r.userId,
      name: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim(),
      avatarUrl: r.avatarUrl ?? null,
      bestScore: parseInt(r.bestScore, 10) || 0,
      gamesPlayed: parseInt(r.gamesPlayed, 10) || 0,
      incentiveEligible: eligibility.get(r.userId) ?? false,
      isCurrentUser: r.userId === currentUserId,
    }));

    return {
      entries,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      periodResetsAt,
    };
  }

  // ═══════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════

  private async pickRandomInterrogation(): Promise<KarmenInterrogationQuestion | null> {
    const all = await this.interrogationRepo.find({ where: { isActive: true } });
    if (!all.length) return null;
    return all[Math.floor(Math.random() * all.length)];
  }

  private async buildRound(
    session: KarmenSession,
    allCases: KarmenCase[],
  ): Promise<{ safeRound: SafeKarmenRound; clueState: KarmenClueState }> {
    const correctId = session.caseSequence[session.currentIndex];
    const correctCase = allCases.find((c) => c.id === correctId) ??
      (await this.caseRepo.findOneOrFail({ where: { id: correctId } }));

    const others = shuffle(allCases.filter((c) => c.id !== correctId)).slice(0, 3);
    const choiceCases = shuffle([correctCase, ...others]);
    const clueField = CLUE_FIELDS[Math.floor(Math.random() * CLUE_FIELDS.length)];

    return {
      safeRound: {
        caseNumber: session.currentIndex + 1,
        zone: correctCase.zone,
        clueText: (correctCase as any)[clueField],
        choices: choiceCases.map((c) => ({ id: c.id, name: c.name, zone: c.zone })),
        timerSeconds: KARMEN_TIMER_SECONDS,
        leads: session.leads,
        hintsLeft: session.hintsLeft,
        streak: session.streak,
        score: session.score,
      },
      clueState: { clueField, choiceCaseIds: choiceCases.map((c) => c.id) },
    };
  }

  private async getOwnedInProgressSession(userId: string, sessionId: string): Promise<KarmenSession> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Game session not found.');
    if (session.userId !== userId) throw new ForbiddenException('This is not your game session.');
    if (session.status !== KarmenSessionStatus.IN_PROGRESS) {
      throw new BadRequestException('This game session has already ended.');
    }
    return session;
  }

  private async finishSession(session: KarmenSession, status: KarmenSessionStatus): Promise<void> {
    session.status = status;
    session.endedAt = new Date();
    // Scaled down from the in-game score so it stays sane alongside
    // exam-session and Scholar-game XP — 20 score points ~= 1 XP, floor
    // of 5 XP for playing at all.
    session.xpEarned = Math.max(5, Math.round(session.score / 20));
    await this.sessionRepo.save(session);

    try {
      const profile = await this.studentsService.findByUserId(session.userId);
      await this.studentsService.awardXp({
        studentProfileId: profile.id,
        xp: session.xpEarned,
        reason: 'game_karmen',
      });
    } catch {
      // No profile — never block the game result over it.
    }
  }
}
