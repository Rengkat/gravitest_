import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { ExamSession } from 'src/students/entities/exam-session.entity';
import { SessionQuestion } from 'src/students/entities/session-questions.entity';
import { EssayScoringStatus, StudentAnswer } from 'src/students/entities/student-answers.entity';
import { Question } from 'src/questions/entities/question.entity';
import { QuestionsService } from 'src/questions/questions.service';
import { StudentsService } from 'src/students/students.service';
import { AiEssayScore } from 'src/ai/entities/ai-essay-score.entity';
import { AiScoringService } from 'src/ai/ai-scoring.service';
import { AiSettingsService } from 'src/ai/ai-settings.service';
import { ExamMode, FeatureKey, NotificationType, QuestionType, SessionStatus } from 'src/common/enums/enums';
import { EntitlementsService } from 'src/entitlements/entitlements.service';
import {
  StartExamSessionDto,
  SubmitAnswerDto,
  FlagQuestionDto,
  AvailableCountQueryDto,
} from './dto/exam-session.dto';
import { flattenEssayParts } from 'src/questions/utils/flatten-essay-parts.util';
import { NotificationsService } from 'src/notifications/notifications.service';

const ESSAY_TYPES = new Set([QuestionType.THEORY, QuestionType.PRACTICAL]);
const ESSAY_PASS_RATIO = 0.5; // awardedScore/maxScore at/above this counts toward questionsCorrect

// XP model (applies to every session type — MCQ, theory, practical, mixed):
//   MCQ     : 10 XP per correct answer.
//   Essay   : up to 10 XP scaled by the AI/teacher score (awarded / max),
//             with a small participation floor so an attempted theory or
//             practical answer always earns something — even when it scored
//             low, is awaiting manual review, or AI grading was unavailable.
//   Mock    : +50 completion bonus.
const MCQ_XP_PER_CORRECT = 10;
const ESSAY_MAX_XP = 10;
const ESSAY_PARTICIPATION_XP = 2;
const MOCK_COMPLETION_BONUS_XP = 50;

/** awarded / max for an essay answer, clamped to 0..1 (0 when not scored yet). */
function essayScoreRatio(answer: StudentAnswer): number {
  const max = Number(answer.maxScore);
  const awarded = Number(answer.awardedScore);
  if (!Number.isFinite(max) || max <= 0 || !Number.isFinite(awarded)) return 0;
  return Math.min(1, Math.max(0, awarded / max));
}

@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);

  constructor(
    @InjectRepository(ExamSession)
    private readonly sessionRepo: Repository<ExamSession>,
    @InjectRepository(SessionQuestion)
    private readonly sessionQuestionRepo: Repository<SessionQuestion>,
    @InjectRepository(StudentAnswer)
    private readonly answerRepo: Repository<StudentAnswer>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(AiEssayScore)
    private readonly essayScoreRepo: Repository<AiEssayScore>,
    private readonly dataSource: DataSource,
    private readonly questionsService: QuestionsService,
    private readonly studentsService: StudentsService,
    private readonly aiScoringService: AiScoringService,
    private readonly aiSettingsService: AiSettingsService,
    private readonly notificationsService: NotificationsService,
    private readonly entitlements: EntitlementsService,
  ) {}

  // ─── AVAILABLE COUNT ────────────────────────────────────────────────────
  // How many questions a session with these filters could actually draw
  // from. Drives the wizard's "number of questions" choices.
  async countAvailable(query: AvailableCountQueryDto) {
    const count = await this.questionsService.countSessionPool({
      examType: query.examType,
      candidateType: query.candidateType,
      subjects: query.subjects,
      year: query.year,
      difficulty: query.difficulty,
      type: query.questionType,
    });
    return { count };
  }

  // ─── START ──────────────────────────────────────────────────────────────
  async startSession(userId: string, dto: StartExamSessionDto) {
    const profile = await this.studentsService.findByUserId(userId);

    const poolFilters = {
      examType: dto.examType,
      candidateType: dto.candidateType,
      subjects: dto.subjects,
      year: dto.year,
      difficulty: dto.difficulty,
    };
    const isMixed = !!dto.theoryQuestionCount;
    const noMatch = (what: string) =>
      new BadRequestException(
        `No ${what} questions match this criteria yet. Try a different subject, exam type, or difficulty.`,
      );

    let pool: Question[];
    if (isMixed) {
      // Mixed = an MCQ part + a theory part, each drawn on its own so the
      // student gets exactly the split they picked.
      const [mcqPool, theoryPool] = await Promise.all([
        this.questionsService.getSessionPool({
          ...poolFilters,
          type: QuestionType.MCQ,
          limit: dto.questionCount,
          shuffled: true,
        }),
        this.questionsService.getSessionPool({
          ...poolFilters,
          type: QuestionType.THEORY,
          limit: dto.theoryQuestionCount!,
          shuffled: true,
        }),
      ]);
      if (!mcqPool.length) throw noMatch('MCQ');
      if (!theoryPool.length) throw noMatch('theory');
      pool = [...mcqPool, ...theoryPool];
    } else {
      pool = await this.questionsService.getSessionPool({
        ...poolFilters,
        type: dto.questionType,
        limit: dto.questionCount,
        shuffled: true,
      });
      if (!pool.length) {
        throw new BadRequestException(
          'No questions match this criteria yet. Try a different subject, exam type, or difficulty.',
        );
      }
      if (pool.length < dto.questionCount) {
        this.logger.warn(
          `Requested ${dto.questionCount} questions but only ${pool.length} matched — starting with what's available.`,
        );
      }
    }

    // Free/paid gate for past-question practice vs timed mocks (admin-editable
    // rules). Deliberately AFTER the pool is validated so a request that would
    // have failed anyway never burns a free-quota use.
    await this.entitlements.assertAccess(
      userId,
      dto.mode === ExamMode.MOCK ? FeatureKey.CBT_MOCK : FeatureKey.CBT_PRACTICE,
    );

    return this.dataSource.transaction(async (manager) => {
      const session = manager.create(ExamSession, {
        studentProfileId: profile.id,
        examType: dto.examType ?? null,
        candidateType: dto.candidateType ?? null,
        subjects: dto.subjects,
        topic: dto.topic ?? null,
        questionType: dto.questionType ?? QuestionType.MCQ,
        mode: dto.mode,
        difficulty: dto.difficulty ?? null,
        sessionTitle: dto.sessionTitle ?? null,
        startedAt: new Date(),
        allowedDurationSeconds: dto.durationMinutes ? dto.durationMinutes * 60 : null,
        status: SessionStatus.IN_PROGRESS,
        totalQuestions: pool.length,
        metadata: {
          year: dto.year,
          shuffled: true,
          ...(isMixed ? { mixed: true, theoryQuestionCount: dto.theoryQuestionCount } : {}),
        },
      });
      const savedSession = await manager.save(ExamSession, session);

      const sessionQuestions = pool.map((q, i) =>
        manager.create(SessionQuestion, {
          order: i,
          examSession: savedSession,
          questionId: q.id,
        }),
      );
      await manager.save(SessionQuestion, sessionQuestions);

      return {
        session: savedSession,
        questions: pool.map((q, i) => this.sanitizeQuestion(q, sessionQuestions[i].id)),
      };
    });
  }

  // ─── FETCH (resume an in-progress session) ─────────────────────────────
  async getSession(userId: string, sessionId: string) {
    const session = await this.loadOwnedSession(userId, sessionId);
    const sessionQuestions = await this.sessionQuestionRepo.find({
      where: { examSession: { id: sessionId } },
      relations: ['studentAnswer'],
      order: { order: 'ASC' },
    });

    const questionIds = sessionQuestions.map((sq) => sq.questionId);
    const questions = await this.questionRepo.find({
      where: questionIds.length ? questionIds.map((id) => ({ id })) : [],
      relations: ['options', 'passage'],
      order: { options: { order: 'ASC' } },
    });
    const byId = new Map(questions.map((q) => [q.id, q]));

    return {
      session,
      questions: sessionQuestions.map((sq) => ({
        ...this.sanitizeQuestion(byId.get(sq.questionId)!, sq.id),
        isAnswered: sq.isAnswered,
        isFlagged: sq.isFlagged,
        yourAnswer: session.status === SessionStatus.IN_PROGRESS ? undefined : sq.studentAnswer,
      })),
    };
  }

  // ─── SUBMIT ANSWER ──────────────────────────────────────────────────────
  async submitAnswer(userId: string, sessionId: string, dto: SubmitAnswerDto) {
    const session = await this.loadOwnedSession(userId, sessionId);
    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new BadRequestException('This session has already been submitted.');
    }

    const sessionQuestion = await this.sessionQuestionRepo.findOne({
      where: { id: dto.sessionQuestionId, examSession: { id: sessionId } },
      relations: ['studentAnswer'],
    });
    if (!sessionQuestion) throw new NotFoundException('Question not found in this session.');

    const question = await this.questionRepo.findOne({
      where: { id: sessionQuestion.questionId },
      relations: ['answer', 'explanations'],
    });
    if (!question) throw new NotFoundException('Underlying question no longer exists.');

    const isEssay = ESSAY_TYPES.has(question.type);
    let answer = sessionQuestion.studentAnswer;

    const leaves = isEssay ? flattenEssayParts(question.structure) : [];

    if (isEssay && leaves.length && dto.partAnswers?.length) {
      // Structured (nested) question: keep one answer per leaf. Unknown
      // paths are dropped so a client can't smuggle in extra parts.
      const byPath = new Map(dto.partAnswers.map((p) => [p.path, p]));
      const partAnswers = leaves.map((leaf) => ({
        path: leaf.path,
        essayText: byPath.get(leaf.path)?.essayText ?? '',
        essayImageUrls: byPath.get(leaf.path)?.essayImageUrls ?? [],
      }));
      const draft = this.answerRepo.create({
        selectedLabel: null,
        selectedOptionId: null,
        // Flattened, labelled copy — keeps teacher review / exports that
        // read essayText working without knowing about partAnswers.
        essayText: partAnswers
          .filter((p) => p.essayText.trim())
          .map((p) => `${p.path}: ${p.essayText.trim()}`)
          .join('\n\n'),
        essayImageUrls: partAnswers.flatMap((p) => p.essayImageUrls),
        partAnswers,
        partScores: null, // any earlier scores are stale once answers change
        aiEssayScoreId: null,
        awardedScore: null,
        scoringStatus: EssayScoringStatus.PENDING,
        maxScore: leaves.reduce((sum, l) => sum + l.maxScore, 0) || (question.maxScore ?? 10),
        isCorrect: false,
        answeredAt: new Date(),
      });
      answer = answer ? Object.assign(answer, draft) : draft;
    } else if (isEssay) {
      const draft = this.answerRepo.create({
        selectedLabel: null,
        selectedOptionId: null,
        essayText: dto.essayText ?? '',
        essayImageUrls: dto.essayImageUrls ?? [],
        partAnswers: null,
        partScores: null,
        scoringStatus: EssayScoringStatus.PENDING,
        maxScore: question.maxScore ?? 10,
        isCorrect: false,
        answeredAt: new Date(),
      });
      answer = answer ? Object.assign(answer, draft) : draft;
    } else {
      const isCorrect = dto.selectedLabel
        ? await this.questionsService.verifyAnswer(question.id, dto.selectedLabel)
        : false;
      const draft = this.answerRepo.create({
        selectedLabel: dto.selectedLabel ?? null,
        essayText: null,
        essayImageUrls: [],
        scoringStatus: EssayScoringStatus.NOT_APPLICABLE,
        isCorrect,
        awardedScore: isCorrect ? 1 : 0,
        maxScore: 1,
        answeredAt: new Date(),
      });
      answer = answer ? Object.assign(answer, draft) : draft;
    }

    const savedAnswer = await this.answerRepo.save(answer);
    sessionQuestion.studentAnswer = savedAnswer;
    sessionQuestion.isAnswered = true;
    sessionQuestion.timeSpentSeconds += dto.timeSpentSeconds ?? 0;
    await this.sessionQuestionRepo.save(sessionQuestion);

    // MCQ correctness can be shown immediately in practice mode; essays
    // are always "pending" until scored at completion. Exam/mock mode
    // never reveals correctness mid-session regardless of question type.
    const revealCorrectness = session.mode === ExamMode.PRACTICE && !isEssay;
    return {
      saved: true,
      isCorrect: revealCorrectness ? savedAnswer.isCorrect : undefined,
      correctLabel: revealCorrectness ? question.answer?.correctLabel : undefined,
      explanation: revealCorrectness ? question.explanations?.[0]?.text : undefined,
    };
  }

  async flagQuestion(userId: string, sessionId: string, dto: FlagQuestionDto) {
    await this.loadOwnedSession(userId, sessionId);
    const sq = await this.sessionQuestionRepo.findOne({
      where: { id: dto.sessionQuestionId, examSession: { id: sessionId } },
    });
    if (!sq) throw new NotFoundException('Question not found in this session.');
    sq.isFlagged = !sq.isFlagged;
    await this.sessionQuestionRepo.save(sq);
    return { isFlagged: sq.isFlagged };
  }

  /**
   * Score a single essay answer immediately, outside the normal
   * batch-at-completion flow — used for practice mode's "check my answer
   * now" button. Not available in mock/exam mode via this endpoint (the
   * controller enforces that), since exam mode shouldn't leak scores
   * mid-session.
   */
  async scoreAnswerNow(userId: string, sessionId: string, sessionQuestionId: string) {
    const session = await this.loadOwnedSession(userId, sessionId);
    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new BadRequestException('This session has already been submitted.');
    }
    if (session.mode !== ExamMode.PRACTICE) {
      throw new ForbiddenException('Instant scoring is only available in practice mode.');
    }

    const sq = await this.sessionQuestionRepo.findOne({
      where: { id: sessionQuestionId, examSession: { id: sessionId } },
      relations: ['studentAnswer'],
    });
    if (!sq?.studentAnswer) {
      throw new NotFoundException('Answer not found — submit an answer before scoring it.');
    }

    const question = await this.questionRepo.findOne({ where: { id: sq.questionId } });
    if (!question) throw new NotFoundException('Question not found.');

    const aiSettings = await this.aiSettingsService.get();
    const structured = !!sq.studentAnswer.partAnswers?.length && flattenEssayParts(question.structure).length > 0;

    let score: {
      id: string | null;
      aiScore: number;
      maxScore: number;
      aiFeedback: string;
      strengths: string[];
      improvements: string[];
      confidence: number;
    };
    let parts: NonNullable<StudentAnswer['partScores']> | undefined;

    if (structured) {
      const graded = await this.scoreStructuredAnswer(userId, question, sq.studentAnswer, 'practice');
      parts = graded.parts;
      sq.studentAnswer.partScores = graded.parts;
      score = {
        id: null,
        aiScore: graded.total,
        maxScore: graded.max,
        aiFeedback: '',
        strengths: [],
        improvements: [],
        confidence: graded.minConfidence,
      };
      sq.studentAnswer.aiEssayScoreId = null;
    } else {
      const single = await this.aiScoringService.scoreEssay(userId, {
        questionId: question.id,
        questionText: question.questionText,
        studentAnswer: sq.studentAnswer.essayText ?? '',
        modelAnswer: question.modelAnswer ?? undefined,
        diagramImageUrls: sq.studentAnswer.essayImageUrls?.length ? sq.studentAnswer.essayImageUrls : undefined,
        maxScore: question.maxScore ?? 10,
        mode: 'practice',
      });
      score = {
        id: single.id,
        aiScore: single.aiScore,
        maxScore: single.maxScore,
        aiFeedback: single.aiFeedback,
        strengths: single.strengths,
        improvements: single.improvements,
        confidence: Number(single.confidence),
      };
      sq.studentAnswer.aiEssayScoreId = single.id;
    }

    sq.studentAnswer.awardedScore = score.aiScore;
    sq.studentAnswer.maxScore = score.maxScore;
    sq.studentAnswer.scoringStatus =
      Number(score.confidence) < Number(aiSettings.autoFlagThreshold)
        ? EssayScoringStatus.NEEDS_REVIEW
        : EssayScoringStatus.SCORED;
    await this.answerRepo.save(sq.studentAnswer);

    if (sq.studentAnswer.scoringStatus === EssayScoringStatus.NEEDS_REVIEW && aiSettings.notifyOnFlagged) {
      this.notificationsService
        .notifyAdmins({
          type: NotificationType.SYSTEM,
          context: {
            title: 'Essay answer needs manual review',
            body: `An AI-graded essay answer (session ${sessionId}) was flagged low-confidence and needs manual review.`,
            actionUrl: `/admin/exams/sessions/${sessionId}`,
          },
          actionUrl: `/admin/exams/sessions/${sessionId}`,
        })
        .catch((err) => this.logger.error(`Essay-needs-review admin alert failed: ${err.message}`));
    }

    return { ...score, parts };
  }

  // ─── COMPLETE ───────────────────────────────────────────────────────────
  async completeSession(userId: string, sessionId: string) {
    const session = await this.loadOwnedSession(userId, sessionId);
    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new BadRequestException('This session has already been submitted.');
    }

    const sessionQuestions = await this.sessionQuestionRepo.find({
      where: { examSession: { id: sessionId } },
      relations: ['studentAnswer'],
      order: { order: 'ASC' },
    });

    const questionIds = sessionQuestions.map((sq) => sq.questionId);
    const questions = await this.questionRepo.find({
      where: questionIds.length ? questionIds.map((id) => ({ id })) : [],
    });
    const byId = new Map(questions.map((q) => [q.id, q]));

    // Score any pending essay answers now, in one batch, right before
    // finalizing — keeps AI calls off the hot path of every keystroke/
    // autosave and means a free-tier user's limited daily calls are only
    // spent on answers they actually submitted.
    let questionsCorrect = 0;
    let questionsAttempted = 0;
    let essaysNeedingReview = 0;
    let answerXp = 0;
    const aiSettings = await this.aiSettingsService.get();
    const subjectTally = new Map<string, { correct: number; total: number; attempted: number }>();
    const topicTally = new Map<string, { correct: number; total: number }>();

    for (const sq of sessionQuestions) {
      const question = byId.get(sq.questionId);
      if (!question) continue;

      const subjectKey = question.subject;
      const subjEntry = subjectTally.get(subjectKey) ?? { correct: 0, total: 0, attempted: 0 };
      subjEntry.total += 1;

      const topicKey = question.topic ?? 'General';
      const topicEntry = topicTally.get(topicKey) ?? { correct: 0, total: 0 };
      topicEntry.total += 1;

      if (!sq.studentAnswer) {
        subjectTally.set(subjectKey, subjEntry);
        topicTally.set(topicKey, topicEntry);
        continue;
      }

      questionsAttempted += 1;
      subjEntry.attempted += 1;

      const isEssay = ESSAY_TYPES.has(question.type);
      let counted = sq.studentAnswer.isCorrect;

      if (isEssay && sq.studentAnswer.scoringStatus === EssayScoringStatus.PENDING) {
        try {
          const scoreMode = session.mode === ExamMode.MOCK ? 'exam' : 'practice';
          const isStructured =
            !!sq.studentAnswer.partAnswers?.length && flattenEssayParts(question.structure).length > 0;
          let score: { id: string | null; aiScore: number; maxScore: number; confidence: number };
          if (isStructured) {
            const graded = await this.scoreStructuredAnswer(userId, question, sq.studentAnswer, scoreMode);
            sq.studentAnswer.partScores = graded.parts;
            score = { id: null, aiScore: graded.total, maxScore: graded.max, confidence: graded.minConfidence };
          } else {
            const single = await this.aiScoringService.scoreEssay(userId, {
              questionId: question.id,
              questionText: question.questionText,
              studentAnswer: sq.studentAnswer.essayText ?? '',
              modelAnswer: question.modelAnswer ?? undefined,
              diagramImageUrls: sq.studentAnswer.essayImageUrls?.length
                ? sq.studentAnswer.essayImageUrls
                : undefined,
              maxScore: question.maxScore ?? 10,
              mode: scoreMode,
            });
            score = { id: single.id, aiScore: single.aiScore, maxScore: single.maxScore, confidence: Number(single.confidence) };
          }
          sq.studentAnswer.aiEssayScoreId = score.id;
          sq.studentAnswer.awardedScore = score.aiScore;
          sq.studentAnswer.maxScore = score.maxScore;
          sq.studentAnswer.scoringStatus =
            Number(score.confidence) < Number(aiSettings.autoFlagThreshold)
              ? EssayScoringStatus.NEEDS_REVIEW
              : EssayScoringStatus.SCORED;
          if (sq.studentAnswer.scoringStatus === EssayScoringStatus.NEEDS_REVIEW) {
            essaysNeedingReview += 1;
          }
          counted = score.aiScore / score.maxScore >= ESSAY_PASS_RATIO;
          await this.answerRepo.save(sq.studentAnswer);
        } catch (err) {
          // Most likely cause: free-tier's small daily AI cap was hit
          // mid-exam. Don't fail the whole submission — leave it PENDING
          // so an admin/teacher can score it manually, and the student
          // still gets their MCQ results immediately.
          this.logger.warn(
            `Essay auto-scoring failed for answer ${sq.studentAnswer.id}, leaving PENDING for manual review: ${(err as Error).message}`,
          );
          counted = false;
        }
      } else if (isEssay) {
        // Essay already graded earlier (e.g. practice mode's "score now").
        // Previously this fell through with `isCorrect` — which is always
        // false for essays — so every instantly-scored theory/practical
        // answer counted as wrong and earned nothing.
        counted = essayScoreRatio(sq.studentAnswer) >= ESSAY_PASS_RATIO;
      }

      if (isEssay) {
        answerXp += Math.max(
          ESSAY_PARTICIPATION_XP,
          Math.round(essayScoreRatio(sq.studentAnswer) * ESSAY_MAX_XP),
        );
      } else if (counted) {
        answerXp += MCQ_XP_PER_CORRECT;
      }

      if (counted) {
        questionsCorrect += 1;
        subjEntry.correct += 1;
        topicEntry.correct += 1;
      }

      subjectTally.set(subjectKey, subjEntry);
      topicTally.set(topicKey, topicEntry);
    }

    session.questionsAttempted = questionsAttempted;
    session.questionsCorrect = questionsCorrect;
    session.questionsSkipped = session.totalQuestions - questionsAttempted;
    session.subjectScores = Array.from(subjectTally.entries()).map(([subject, v]) => ({
      subject: subject as never,
      score: v.correct,
      total: v.total,
      percentage: v.total ? Math.round((v.correct / v.total) * 100) : 0,
    }));
    session.topicBreakdown = Array.from(topicTally.entries()).map(([topic, v]) => ({
      topic,
      total: v.total,
      correct: v.correct,
      score: v.total ? Math.round((v.correct / v.total) * 100) : 0,
    }));

    session.complete(); // entity method: sets status/completedAt/timeSpentSeconds + percentage/scaledScore

    // XP: see the model at the top of this file. Mock exams get a completion
    // bonus (vs. free-form practice) to nudge students toward full attempts.
    const xpEarned = answerXp + (session.mode === ExamMode.MOCK ? MOCK_COMPLETION_BONUS_XP : 0);
    session.xpEarned = xpEarned;
    const savedSession = await this.sessionRepo.save(session);

    // Each progress step is isolated: previously they ran back-to-back with
    // plain awaits, so if XP or the profile-cache update threw, the streak
    // (recordActivity) never ran at all.
    await this.trackProgress('awardXp', savedSession.id, () =>
      this.studentsService.awardXp({
        studentProfileId: session.studentProfileId,
        xp: xpEarned,
        reason: 'exam_completed',
      }),
    );
    await this.trackProgress('updateAfterSession', savedSession.id, () =>
      this.studentsService.updateAfterSession({
        profileId: session.studentProfileId,
        percentage: session.percentage,
        examType: session.examType,
        subjects: session.subjects,
        subjectScores: session.subjectScores,
      }),
    );
    await this.trackProgress('recordActivity (streak)', savedSession.id, () =>
      this.studentsService.recordActivity({
        studentProfileId: session.studentProfileId,
        minutesStudied: Math.max(1, Math.round(session.timeSpentSeconds / 60)),
        questionsAttempted,
        questionsCorrect,
        xpEarned,
        subjectBreakdown: Array.from(subjectTally.entries()).map(([subject, v]) => ({
          subject,
          minutes: 0,
          questionsAttempted: v.attempted,
          questionsCorrect: v.correct,
          score: v.total ? Math.round((v.correct / v.total) * 100) : 0,
        })),
      }),
    );

    // Notifications: best-effort, never block/fail the exam completion
    // response over a notification/email hiccup.
    this.notificationsService
      .notifyBoth({
        userId,
        type: NotificationType.RESULT_PUBLISHED,
        context: {
          sessionTitle: savedSession.sessionTitle ?? savedSession.examType ?? 'exam',
          score: savedSession.percentage,
          sessionId: savedSession.id,
        },
      })
      .catch((err) =>
        this.logger.error(`RESULT_PUBLISHED notification failed for session ${savedSession.id}: ${err.message}`),
      );

    if (essaysNeedingReview > 0 && aiSettings.notifyOnFlagged) {
      this.notificationsService
        .notifyAdmins({
          type: NotificationType.SYSTEM,
          context: {
            title: 'Essay answers need manual review',
            body: `${essaysNeedingReview} essay answer(s) in session ${savedSession.id} were flagged low-confidence by AI grading and need manual review.`,
            actionUrl: `/admin/exams/sessions/${savedSession.id}`,
          },
          actionUrl: `/admin/exams/sessions/${savedSession.id}`,
        })
        .catch((err) =>
          this.logger.error(`Essay-needs-review admin alert failed for session ${savedSession.id}: ${err.message}`),
        );
    }

    return savedSession;
  }

  // ─── RESULTS (full breakdown, only after completion) ──────────────────
  async getResults(userId: string, sessionId: string) {
    const session = await this.loadOwnedSession(userId, sessionId);
    if (session.status === SessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Submit this session before viewing results.');
    }

    const sessionQuestions = await this.sessionQuestionRepo.find({
      where: { examSession: { id: sessionId } },
      relations: ['studentAnswer'],
      order: { order: 'ASC' },
    });
    const questionIds = sessionQuestions.map((sq) => sq.questionId);
    const questions = await this.questionRepo.find({
      where: questionIds.length ? questionIds.map((id) => ({ id })) : [],
      relations: ['options', 'answer', 'explanations', 'passage'],
      order: { options: { order: 'ASC' } },
    });
    const byId = new Map(questions.map((q) => [q.id, q]));

    // Batch-fetch AI feedback for essay answers in one query rather than
    // N+1 — the results page needs the actual feedback text, not just
    // the numeric score.
    const essayScoreIds = sessionQuestions
      .map((sq) => sq.studentAnswer?.aiEssayScoreId)
      .filter((id): id is string => !!id);
    const essayScores = essayScoreIds.length
      ? await this.essayScoreRepo.findBy({ id: In(essayScoreIds) })
      : [];
    const essayScoreById = new Map(essayScores.map((s) => [s.id, s]));

    return {
      session,
      breakdown: sessionQuestions.map((sq) => {
        const question = byId.get(sq.questionId);
        const essayScore = sq.studentAnswer?.aiEssayScoreId
          ? essayScoreById.get(sq.studentAnswer.aiEssayScoreId)
          : undefined;
        return {
          sessionQuestionId: sq.id,
          question: {
            id: question?.id,
            questionText: question?.questionText,
            questionImageUrl: question?.questionImageUrl,
            type: question?.type,
            subject: question?.subject,
            options: question?.options,
            correctLabel: question?.answer?.correctLabel,
            explanations: question?.explanations,
            maxScore: question?.maxScore,
            structure: question?.structure ?? null,
            passage: question?.passage
              ? {
                  id: question.passage.id,
                  title: question.passage.title,
                  instructions: question.passage.instructions,
                  passageText: question.passage.passageText,
                  passageImageUrl: question.passage.passageImageUrl,
                }
              : null,
          },
          yourAnswer: sq.studentAnswer
            ? {
                selectedLabel: sq.studentAnswer.selectedLabel,
                essayText: sq.studentAnswer.essayText,
                essayImageUrls: sq.studentAnswer.essayImageUrls,
                isCorrect: sq.studentAnswer.isCorrect,
                awardedScore: sq.studentAnswer.awardedScore,
                maxScore: sq.studentAnswer.maxScore,
                scoringStatus: sq.studentAnswer.scoringStatus,
                aiEssayScoreId: sq.studentAnswer.aiEssayScoreId,
                aiFeedback: essayScore?.aiFeedback,
                aiStrengths: essayScore?.strengths,
                aiImprovements: essayScore?.improvements,
                // Structured questions: per-part answers + scores
                partAnswers: sq.studentAnswer.partAnswers,
                partScores: sq.studentAnswer.partScores,
              }
            : null,
        };
      }),
    };
  }

  async listMySessions(userId: string) {
    const profile = await this.studentsService.findByUserId(userId);
    return this.sessionRepo.find({
      where: { studentProfileId: profile.id },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  // ─── PRIVATE HELPERS ────────────────────────────────────────────────────
  /** Runs one XP/streak/profile step; a failure is logged but never blocks the others or the submission. */
  private async trackProgress(label: string, sessionId: string, fn: () => Promise<unknown>): Promise<void> {
    try {
      await fn();
    } catch (err) {
      this.logger.error(`${label} failed for session ${sessionId}: ${(err as Error).message}`);
    }
  }

  private async loadOwnedSession(userId: string, sessionId: string): Promise<ExamSession> {
    const profile = await this.studentsService.findByUserId(userId);
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Exam session not found.');
    if (session.studentProfileId !== profile.id) {
      throw new ForbiddenException('This session does not belong to you.');
    }
    return session;
  }

  /** Strips the correct answer / explanation out of a question before sending it to a student mid-exam. */
  /**
   * Scores every answerable leaf of a structured (nested) theory/practical
   * question independently, against that leaf's own max marks. Leaves the
   * student left blank score 0 without spending an AI call. Runs a few
   * leaves at a time to keep latency down without bursting the rate limiter.
   *
   * NOTE: EssayPart has no per-leaf model answer today, so the question's
   * whole mark scheme is passed as reference for every leaf, with an
   * instruction to mark only that sub-question. Adding a modelAnswer to
   * each leaf would tighten this further.
   */
  private async scoreStructuredAnswer(
    userId: string,
    question: Question,
    studentAnswer: StudentAnswer,
    mode: 'practice' | 'exam',
  ) {
    const leaves = flattenEssayParts(question.structure);
    const answers = new Map((studentAnswer.partAnswers ?? []).map((p) => [p.path, p]));
    const parts: NonNullable<StudentAnswer['partScores']> = [];

    const scoreLeaf = async (leaf: (typeof leaves)[number]) => {
      const given = answers.get(leaf.path);
      const text = given?.essayText?.trim() ?? '';
      const images = given?.essayImageUrls ?? [];
      if (leaf.maxScore < 1) return null; // unmarked heading-like leaf
      if (!text && !images.length) {
        return {
          path: leaf.path,
          awardedScore: 0,
          maxScore: leaf.maxScore,
          confidence: 1,
          aiEssayScoreId: null,
          feedback: 'No answer was provided for this part.',
          strengths: [] as string[],
          improvements: ['Attempt every part — even a partial answer can earn marks.'],
        };
      }
      const result = await this.aiScoringService.scoreEssay(userId, {
        questionId: question.id,
        questionText:
          `Mark ONLY sub-question ${leaf.path}, worth ${leaf.maxScore} mark(s). The full mark scheme below covers the whole question — use only the part that applies to this sub-question.\n\n` +
          `${leaf.context ? leaf.context + '\n' : ''}${leaf.label} ${leaf.text}`.trim(),
        studentAnswer: text,
        modelAnswer: question.modelAnswer ?? undefined,
        diagramImageUrls: images.length ? images : undefined,
        maxScore: leaf.maxScore,
        mode,
      });
      return {
        path: leaf.path,
        awardedScore: Math.min(leaf.maxScore, Math.max(0, Math.round(result.aiScore))),
        maxScore: leaf.maxScore,
        confidence: Number(result.confidence),
        aiEssayScoreId: result.id,
        feedback: result.aiFeedback,
        strengths: result.strengths ?? [],
        improvements: result.improvements ?? [],
      };
    };

    const CONCURRENCY = 3;
    for (let i = 0; i < leaves.length; i += CONCURRENCY) {
      const batch = await Promise.all(leaves.slice(i, i + CONCURRENCY).map(scoreLeaf));
      for (const r of batch) if (r) parts.push(r);
    }

    return {
      parts,
      total: parts.reduce((sum, p) => sum + p.awardedScore, 0),
      max: parts.reduce((sum, p) => sum + p.maxScore, 0),
      minConfidence: parts.length ? Math.min(...parts.map((p) => p.confidence)) : 1,
    };
  }

  private sanitizeQuestion(question: Question, sessionQuestionId: string) {
    return {
      sessionQuestionId,
      id: question.id,
      questionNumber: question.questionNumber,
      examType: question.examType,
      subject: question.subject,
      year: question.year,
      questionText: question.questionText,
      questionImageUrl: question.questionImageUrl,
      difficulty: question.difficulty,
      type: question.type,
      topic: question.topic,
      maxScore: question.type === QuestionType.MCQ ? 1 : question.maxScore,
      // Nested part tree (labels, text, marks, images) — contains no answers,
      // so it's safe to send mid-exam. Drives the per-part answer boxes.
      structure: question.structure ?? null,
      options: question.options?.map((o) => ({
        id: o.id,
        label: o.label,
        text: o.text,
        imageUrl: o.imageUrl,
        order: o.order,
      })),
      // Comprehension/diagram set this question belongs to, if any — the
      // frontend renders this once above every question in the group
      // (see PassagePanel in the CBT player).
      passage: question.passage
        ? {
            id: question.passage.id,
            title: question.passage.title,
            instructions: question.passage.instructions,
            passageText: question.passage.passageText,
            passageImageUrl: question.passage.passageImageUrl,
          }
        : null,
    };
  }
}
