import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GameLifelinesUsed,
  GameSession,
  GameSessionStatus,
  GameSlug,
} from './entities/game-session.entity';
import { QuestionsService } from 'src/questions/questions.service';
import { StudentsService } from 'src/students/students.service';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { QuestionType, Subject, SubscriptionTier } from 'src/common/enums/enums';
import { StartScholarSessionDto } from './dto/scholar-game.dto';

// GAME CONSTANTS - mirrors the prototype exactly (gravitas-millionaire-v2.html)
// so the numbers the frontend renders (prize ladder, milestones, question
// count) stay in sync with what the server actually enforces. Server is
// the source of truth; the frontend must never compute a prize on its own.
export const SCHOLAR_QUESTIONS_PER_GAME = 15;
export const SCHOLAR_PRIZE_LADDER = [
  500, 1000, 2000, 3000, 5000, 7500, 10000, 12500, 15000, 25000, 50000, 100000, 250000, 500000,
  1000000,
];
// 0-indexed question positions (Q5, Q10, Q15) that lock in a guaranteed prize.
export const SCHOLAR_MILESTONE_INDEXES = new Set([4, 9, 14]);
export const SCHOLAR_TIME_PER_QUESTION_SEC = 60;
// Games are free to play, but only these tiers are eligible to win the
// monthly incentive - matches the same "genuinely active, non-FREE
// subscription" rule used for the study leaderboard and library access.
const INCENTIVE_ELIGIBLE_TIERS = new Set([
  SubscriptionTier.BASIC,
  SubscriptionTier.STANDARD,
  SubscriptionTier.PREMIUM,
  SubscriptionTier.ENTERPRISE,
]);

export interface SafeGameOption {
  label: string;
  text: string;
  imageUrl: string | null;
}
export interface SafeGameQuestion {
  id: string;
  text: string;
  imageUrl: string | null;
  options: SafeGameOption[];
  passage: {
    title: string | null;
    instructions: string | null;
    passageText: string | null;
    passageImageUrl: string | null;
  } | null;
}

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GameSession)
    private readonly sessionRepo: Repository<GameSession>,
    private readonly questionsService: QuestionsService,
    private readonly studentsService: StudentsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // SUBJECTS - only offer a subject once there's real content for it
  async getScholarSubjects(): Promise<{ subject: Subject; questionCount: number }[]> {
    const counts = await this.questionsService.getMcqSubjectCounts();
    return counts
      .filter((c) => c.count >= SCHOLAR_QUESTIONS_PER_GAME)
      .map((c) => ({ subject: c.subject as Subject, questionCount: c.count }))
      .sort((a, b) => a.subject.localeCompare(b.subject));
  }

  // START SESSION
  async startScholarSession(
    userId: string,
    dto: StartScholarSessionDto,
  ): Promise<{ sessionId: string; subject: Subject; questions: SafeGameQuestion[] }> {
    // A student can only have one Scholar game in progress at a time -
    // quietly abandon any stale in-progress session rather than let
    // sessions pile up (e.g. closed tab mid-game, never hit quit/lose).
    await this.sessionRepo.update(
      { userId, gameSlug: GameSlug.WHO_WANTS_TO_BE_A_SCHOLAR, status: GameSessionStatus.IN_PROGRESS },
      { status: GameSessionStatus.QUIT, endedAt: new Date() },
    );

    // Anti-cramming: a fresh, randomly-ordered set of real questions every
    // time - see QuestionsService.getSessionPool's in-memory shuffle. With
    // a large enough per-subject bank this alone makes memorizing a fixed
    // question order impractical; excluding a student's own recent
    // question IDs is a natural next layer if/when the bank per subject
    // grows large enough that repeats become noticeably common.
    const questions = await this.questionsService.getSessionPool({
      subjects: [dto.subject],
      type: QuestionType.MCQ,
      limit: SCHOLAR_QUESTIONS_PER_GAME,
      shuffled: true,
    });

    if (questions.length < SCHOLAR_QUESTIONS_PER_GAME) {
      throw new BadRequestException(
        `Not enough ${dto.subject} questions available yet for a full game - check back soon.`,
      );
    }

    const session = this.sessionRepo.create({
      userId,
      gameSlug: GameSlug.WHO_WANTS_TO_BE_A_SCHOLAR,
      subject: dto.subject,
      status: GameSessionStatus.IN_PROGRESS,
      questionIds: questions.map((q) => q.id),
      currentIndex: 0,
      lifelinesUsed: {},
      fiftyFiftyRemoved: null,
      prizeWon: 0,
      correctCount: 0,
      xpEarned: 0,
    });
    const saved = await this.sessionRepo.save(session);

    return {
      sessionId: saved.id,
      subject: dto.subject,
      questions: questions.map((q) => this.sanitizeQuestion(q)),
    };
  }

  // SUBMIT ANSWER
  async submitAnswer(
    userId: string,
    sessionId: string,
    questionId: string,
    selectedLabel: string,
  ) {
    const session = await this.getOwnedInProgressSession(userId, sessionId);
    const currentQuestionId = session.questionIds[session.currentIndex];
    if (currentQuestionId !== questionId) {
      throw new BadRequestException('That is not the current question for this session.');
    }

    const { isCorrect, correctLabel } = await this.questionsService.checkAnswer(
      questionId,
      selectedLabel,
    );

    if (isCorrect) {
      session.correctCount += 1;
      session.prizeWon = SCHOLAR_PRIZE_LADDER[session.currentIndex];
      session.currentIndex += 1;
      session.fiftyFiftyRemoved = null;

      const wonJackpot = session.currentIndex >= SCHOLAR_QUESTIONS_PER_GAME;
      if (wonJackpot) {
        await this.finishSession(session, GameSessionStatus.WON);
      } else {
        await this.sessionRepo.save(session);
      }

      return {
        isCorrect: true,
        correctLabel,
        prizeWon: session.prizeWon,
        isMilestone: SCHOLAR_MILESTONE_INDEXES.has(session.currentIndex - 1),
        sessionStatus: session.status,
        nextQuestionIndex: wonJackpot ? null : session.currentIndex,
        xpEarned: wonJackpot ? session.xpEarned : undefined,
      };
    }

    // Wrong answer - game over, walks away with the last guaranteed prize.
    session.prizeWon = this.getGuaranteedPrize(session.currentIndex);
    await this.finishSession(session, GameSessionStatus.LOST);

    return {
      isCorrect: false,
      correctLabel,
      prizeWon: session.prizeWon,
      isMilestone: false,
      sessionStatus: session.status,
      nextQuestionIndex: null,
      xpEarned: session.xpEarned,
    };
  }

  // LIFELINES - 50:50 needs the real answer server-side (to know which
  // two WRONG options to remove without ever revealing the correct one).
  // Phone-a-Friend and Ask-the-Audience are deliberately simulated,
  // flavor-text hints in the original prototype (a fabricated "I think
  // it's B" / a fake poll split) - they carry no real signal today, so
  // they stay exactly as client-side flavor rather than being wired to
  // a backend call that would do nothing more than what Math.random()
  // already does in the browser. Skip just advances past a question
  // with no prize change, same as the prototype.
  async useLifeline(userId: string, sessionId: string, lifeline: 'll50' | 'skip') {
    const session = await this.getOwnedInProgressSession(userId, sessionId);
    if (session.lifelinesUsed[lifeline]) {
      throw new BadRequestException('That lifeline has already been used this game.');
    }

    session.lifelinesUsed = { ...session.lifelinesUsed, [lifeline]: true } as GameLifelinesUsed;

    if (lifeline === 'll50') {
      const questionId = session.questionIds[session.currentIndex];
      const { correctLabel } = await this.questionsService.checkAnswer(questionId, '__probe__');
      const allLabels = ['A', 'B', 'C', 'D'];
      const wrongLabels = allLabels.filter((l) => l !== correctLabel);
      const removed = wrongLabels.sort(() => Math.random() - 0.5).slice(0, 2);
      session.fiftyFiftyRemoved = removed;
      await this.sessionRepo.save(session);
      return { removedLabels: removed };
    }

    // skip
    session.currentIndex += 1;
    session.fiftyFiftyRemoved = null;
    const finished = session.currentIndex >= SCHOLAR_QUESTIONS_PER_GAME;
    if (finished) {
      await this.finishSession(session, GameSessionStatus.WON);
    } else {
      await this.sessionRepo.save(session);
    }
    return { nextQuestionIndex: finished ? null : session.currentIndex, sessionStatus: session.status };
  }

  // QUIT - walk away with whatever's guaranteed right now
  async quitSession(userId: string, sessionId: string) {
    const session = await this.getOwnedInProgressSession(userId, sessionId);
    session.prizeWon = this.getGuaranteedPrize(session.currentIndex);
    await this.finishSession(session, GameSessionStatus.QUIT);
    return { prizeWon: session.prizeWon, xpEarned: session.xpEarned };
  }

  // MY STATS - for the game landing page's "Highest Score" widget
  async getMyScholarStats(userId: string) {
    const best = await this.sessionRepo
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .andWhere('s.gameSlug = :slug', { slug: GameSlug.WHO_WANTS_TO_BE_A_SCHOLAR })
      .andWhere('s.status != :inProgress', { inProgress: GameSessionStatus.IN_PROGRESS })
      .orderBy('s.prizeWon', 'DESC')
      .getOne();

    const gamesPlayed = await this.sessionRepo.count({
      where: { userId, gameSlug: GameSlug.WHO_WANTS_TO_BE_A_SCHOLAR },
    });

    return {
      highestScore: best?.prizeWon ?? 0,
      gamesPlayed,
    };
  }

  // MONTHLY LEADERBOARD (subscriber-incentive-eligible)
  //
  // Ranked by each player's BEST single-session prize this calendar
  // month, not cumulative XP from grinding - matches the product
  // decision that one great play should outrank many mediocre ones.
  // Total XP and games-played are shown as secondary context, not the
  // ranking key. The game itself is free for everyone; only players
  // with an active, non-FREE subscription are flagged eligible to
  // actually win the incentive, same conservative "genuinely active"
  // rule used for the study leaderboard and library access.
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
        .andWhere('s.status != :inProgress', { inProgress: GameSessionStatus.IN_PROGRESS })
        .groupBy('s.userId')
        .addGroupBy('u.firstName')
        .addGroupBy('u.lastName')
        .addGroupBy('u.avatarUrl')
        .select('s.userId', 'userId')
        .addSelect('MAX(s.prizeWon)', 'bestPrize')
        .addSelect('SUM(s.xpEarned)', 'totalXp')
        .addSelect('COUNT(*)', 'gamesPlayed')
        .addSelect('u.firstName', 'firstName')
        .addSelect('u.lastName', 'lastName')
        .addSelect('u.avatarUrl', 'avatarUrl')
        .orderBy('"bestPrize"', 'DESC');

    const totalRow = await qb().select('COUNT(DISTINCT s.userId)', 'count').getRawOne();
    const total = parseInt(totalRow?.count ?? '0', 10);

    const rows = await qb()
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    const eligibility = await this.getEligibilityMap(rows.map((r) => r.userId));

    const entries = rows.map((r, idx) => ({
      rank: (page - 1) * limit + idx + 1,
      userId: r.userId,
      name: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim(),
      avatarUrl: r.avatarUrl ?? null,
      bestPrize: parseInt(r.bestPrize, 10) || 0,
      totalXp: parseInt(r.totalXp, 10) || 0,
      gamesPlayed: parseInt(r.gamesPlayed, 10) || 0,
      incentiveEligible: eligibility.get(r.userId) ?? false,
      isCurrentUser: r.userId === currentUserId,
    }));

    let currentUserEntry = entries.find((e) => e.isCurrentUser) ?? null;
    if (!currentUserEntry && currentUserId) {
      const mine = await qb().andWhere('s.userId = :uid', { uid: currentUserId }).getRawOne();
      if (mine) {
        const rank = await qb()
          .andWhere('s.userId != :uid', { uid: currentUserId })
          .having('MAX(s.prizeWon) > :myBest', { myBest: mine.bestPrize })
          .getRawMany();
        const myEligibility = await this.getEligibilityMap([currentUserId]);
        currentUserEntry = {
          rank: rank.length + 1,
          userId: currentUserId,
          name: `${mine.firstName ?? ''} ${mine.lastName ?? ''}`.trim(),
          avatarUrl: mine.avatarUrl ?? null,
          bestPrize: parseInt(mine.bestPrize, 10) || 0,
          totalXp: parseInt(mine.totalXp, 10) || 0,
          gamesPlayed: parseInt(mine.gamesPlayed, 10) || 0,
          incentiveEligible: myEligibility.get(currentUserId) ?? false,
          isCurrentUser: true,
        };
      }
    }

    return {
      entries,
      currentUserEntry,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      periodResetsAt,
    };
  }

  // PRIVATE HELPERS

  private async getEligibilityMap(userIds: string[]): Promise<Map<string, boolean>> {
    const map = new Map<string, boolean>();
    await Promise.all(
      userIds.map(async (userId) => {
        const sub = await this.subscriptionsService.getCurrentSubscription(userId);
        const eligible = !!sub && sub.isActive() && INCENTIVE_ELIGIBLE_TIERS.has(sub.tier);
        map.set(userId, eligible);
      }),
    );
    return map;
  }

  private async getOwnedInProgressSession(userId: string, sessionId: string): Promise<GameSession> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Game session not found.');
    if (session.userId !== userId) throw new ForbiddenException('This is not your game session.');
    if (session.status !== GameSessionStatus.IN_PROGRESS) {
      throw new BadRequestException('This game session has already ended.');
    }
    return session;
  }

  private getGuaranteedPrize(currentIndex: number): number {
    const milestones = [4, 9, 14];
    for (let i = milestones.length - 1; i >= 0; i--) {
      if (currentIndex > milestones[i]) return SCHOLAR_PRIZE_LADDER[milestones[i]];
    }
    return 0;
  }

  private async finishSession(session: GameSession, status: GameSessionStatus): Promise<void> {
    session.status = status;
    session.endedAt = new Date();
    // XP is scaled down from the naira prize so it stays sane alongside
    // exam-session XP (a few hundred XP per session, not a few hundred
    // thousand) - N1,000 of prize ~= 1 XP, floor of 5 XP for playing at
    // all so a very-early loss still earns something.
    session.xpEarned = Math.max(5, Math.round(session.prizeWon / 1000));
    await this.sessionRepo.save(session);

    try {
      const profile = await this.studentsService.findByUserId(session.userId);
      await this.studentsService.awardXp({
        studentProfileId: profile.id,
        xp: session.xpEarned,
        reason: 'game_scholar',
      });
    } catch {
      // A student without a profile (shouldn't happen for a real
      // student account) just doesn't get XP - never block the game
      // result over it.
    }
  }

  private sanitizeQuestion(q: any): SafeGameQuestion {
    return {
      id: q.id,
      text: q.questionText,
      imageUrl: q.questionImageUrl,
      options: (q.options ?? [])
        .slice()
        .sort((a: any, b: any) => a.order - b.order)
        .map((o: any) => ({ label: o.label, text: o.text, imageUrl: o.imageUrl })),
      passage: q.passage
        ? {
            title: q.passage.title,
            instructions: q.passage.instructions,
            passageText: q.passage.passageText,
            passageImageUrl: q.passage.passageImageUrl,
          }
        : null,
    };
  }
}
