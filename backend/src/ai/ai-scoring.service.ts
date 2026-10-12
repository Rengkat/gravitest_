import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AiEssayScore } from './entities/ai-essay-score.entity';
import { AiRubric } from './entities/ai-rubric.entity';
import { AiRouterService } from './ai-router.service';
import { AiPromptService } from './ai-prompt.service';
import { AiRateLimitService } from './ai-rate-limit.service';
import { ScoreEssayDto } from './dto/score-essay.dto';
import { AIFeature, FeatureKey } from 'src/common/enums/enums';
import { EntitlementsService } from 'src/entitlements/entitlements.service';
import { Question } from 'src/questions/entities/question.entity';
import { AiSettingsService } from './ai-settings.service';
import { QuestionsService } from 'src/questions/questions.service';

// NOTE: the fixed 0.65 threshold that used to live here is now a live,
// admin-editable setting — see AiSettingsService.autoFlagThreshold and
// GET/PATCH /ai/admin/settings.

interface ParsedScoringResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  confidence: number;
  criteria: {
    criterion: string;
    maxPoints: number;
    awardedPoints: number;
    feedback: string;
  }[];
}

@Injectable()
export class AiScoringService {
  private readonly logger = new Logger(AiScoringService.name);

  constructor(
    @InjectRepository(AiEssayScore)
    private readonly essayScoreRepository: Repository<AiEssayScore>,

    @InjectRepository(AiRubric)
    private readonly rubricRepository: Repository<AiRubric>,

    private readonly router: AiRouterService,
    private readonly promptService: AiPromptService,
    private readonly rateLimitService: AiRateLimitService,
    private readonly entitlements: EntitlementsService,
    private readonly aiSettingsService: AiSettingsService,
    private readonly questionsService: QuestionsService,
  ) {}

  async scoreEssay(userId: string, dto: ScoreEssayDto): Promise<AiEssayScore> {
    const feature =
      dto.mode === 'exam' ? AIFeature.EXAM_GRADING : AIFeature.PRACTICE_SCORING;
    await this.entitlements.assertAccess(userId, FeatureKey.AI_ESSAY_SCORING);
    await this.rateLimitService.assertWithinLimits(userId);

    // If this essay belongs to a comprehension/passage set (e.g. WAEC
    // "read the passage and summarize it"), the AI needs the actual
    // passage to grade against — without it, it would be scoring a
    // summary/response against nothing to compare it to. Fetched
    // server-side from the question's own passage link rather than
    // trusting the frontend to pass it, so this can never go stale or
    // be spoofed.
    let passageText: string | null = null;
    if (dto.questionId) {
      try {
        const question = await this.questionsService.findOne(dto.questionId);
        passageText = question?.passage?.passageText ?? null;
      } catch {
        // Question lookup failing shouldn't block scoring — it just means
        // no passage context gets added to the prompt this time.
      }
    }

    const basePrompt = await this.promptService.getActivePrompt(feature);
    const systemPrompt = this.buildSystemPrompt(basePrompt, dto);
    const userContent = this.buildUserContent(dto, passageText);
    const hasDiagrams = !!dto.diagramImageUrls?.length;

    let parsed: ParsedScoringResult;
    try {
      const result = await this.router.complete({
        feature,
        userId,
        systemPrompt,
        messages: [{ role: 'user', content: userContent }],
        jsonMode: true,
        relatedEntityType: 'essay_score',
        requiresVision: hasDiagrams,
      });
      parsed = this.parseResponse(result.text, dto);
    } catch (err) {
      this.logger.error(`Essay scoring failed: ${(err as Error).message}`);
      parsed = {
        score: 0,
        feedback:
          'Could not connect to the AI scoring service. Please try again.',
        strengths: [],
        improvements: [],
        confidence: 0,
        criteria: [],
      };
    }

    const score = this.essayScoreRepository.create({
      questionId: dto.questionId ?? null,
      questionText: dto.questionText,
      userId,
      feature,
      studentAnswer: dto.studentAnswer,
      modelAnswer: dto.modelAnswer ?? null,
      diagramImageUrls: dto.diagramImageUrls ?? [],
      aiScore: Math.min(parsed.score, dto.maxScore),
      maxScore: dto.maxScore,
      aiFeedback: parsed.feedback,
      strengths: parsed.strengths,
      improvements: parsed.improvements,
      confidence: parsed.confidence,
      scoringCriteria: parsed.criteria,
    });
    return this.essayScoreRepository.save(score);
  }

  async reviewScore(
    adminId: string,
    id: string,
    reviewedScore: number,
    reviewNotes?: string,
  ): Promise<AiEssayScore> {
    const score = await this.essayScoreRepository.findOne({ where: { id } });
    if (!score) throw new NotFoundException('Score not found.');
    score.reviewedBy = adminId;
    score.reviewedScore = reviewedScore;
    score.reviewNotes = reviewNotes ?? null;
    return this.essayScoreRepository.save(score);
  }

  async needsReview(): Promise<AiEssayScore[]> {
    const threshold = await this.aiSettingsService.getAutoFlagThreshold();
    return this.essayScoreRepository
      .createQueryBuilder('s')
      .where('s.confidence < :threshold', { threshold })
      .andWhere('s.reviewedBy IS NULL')
      .orderBy('s.gradedAt', 'DESC')
      .getMany();
  }

  async getAnalytics(): Promise<{
    totalQuestionsGraded: number;
    averageScorePct: number;
    scoreDistribution: { range: string; count: number }[];
    teacherReviewRate: number;
    reviewDiscrepancyAvg: number | null;
  }> {
    const total = await this.essayScoreRepository.count();
    if (total === 0) {
      return {
        totalQuestionsGraded: 0,
        averageScorePct: 0,
        scoreDistribution: [],
        teacherReviewRate: 0,
        reviewDiscrepancyAvg: null,
      };
    }

    const all = await this.essayScoreRepository.find();
    const pctScores = all.map((s) => (s.aiScore / s.maxScore) * 100);
    const averageScorePct = pctScores.reduce((a, b) => a + b, 0) / total;

    const buckets = [
      { range: '0-40', min: 0, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 },
    ];
    const scoreDistribution = buckets.map((b) => ({
      range: b.range,
      count: pctScores.filter((p) => p >= b.min && p <= b.max).length,
    }));

    const reviewed = all.filter((s) => s.reviewedScore != null);
    const teacherReviewRate = reviewed.length / total;
    const reviewDiscrepancyAvg =
      reviewed.length > 0
        ? reviewed.reduce(
            (sum, s) => sum + Math.abs((s.reviewedScore as number) - s.aiScore),
            0,
          ) / reviewed.length
        : null;

    return {
      totalQuestionsGraded: total,
      averageScorePct,
      scoreDistribution,
      teacherReviewRate,
      reviewDiscrepancyAvg,
    };
  }

  // ─── PRIVATE HELPERS ────────────────────────────────────────────────────────

  private buildSystemPrompt(base: string, dto: ScoreEssayDto): string {
    const parts = [
      base,
      'Respond ONLY with valid JSON — no markdown, no code fences, no preamble.',
    ];

    if (dto.rubric?.length) {
      parts.push(
        `Score against EXACTLY these criteria, one entry per criterion:\n${JSON.stringify(
          dto.rubric.map((r) => ({
            criterion: r.criterion,
            maxPoints: r.maxPoints,
          })),
        )}`,
      );
      parts.push(
        `JSON shape:\n{"score": <integer 0-${dto.maxScore}>, "feedback": "<2-3 sentence overall comment>", "strengths": ["<point>"], "improvements": ["<point>"], "confidence": <float 0-1>, "criteria": [{"criterion": "<name>", "maxPoints": <int>, "awardedPoints": <int>, "feedback": "<short comment>"}]}`,
      );
    } else {
      parts.push(
        `JSON shape:\n{"score": <integer 0-${dto.maxScore}>, "feedback": "<2-3 sentence overall comment>", "strengths": ["<point>"], "improvements": ["<point>"], "confidence": <float 0-1, your own confidence in this score>}`,
      );
    }

    return parts.join('\n\n');
  }

  private buildUserContent(
    dto: ScoreEssayDto,
    passageText?: string | null,
  ): string | import('./interfaces/ai-provider.interface').AiContentPart[] {
    const text = [
      passageText ? `Passage the question refers to:\n${passageText}` : '',
      `Question (${dto.maxScore} marks): ${dto.questionText}`,
      `Student's Answer: ${dto.studentAnswer || '(No answer provided)'}`,
      dto.modelAnswer ? `Mark Scheme / Model Answer:\n${dto.modelAnswer}` : '',
      dto.diagramImageUrls?.length
        ? `The student's answer includes ${dto.diagramImageUrls.length} diagram(s)/image(s) attached below — evaluate them as part of the answer (labeling accuracy, correctness of what's drawn, relevance to the question).`
        : '',
      passageText
        ? `Score the student's answer out of ${dto.maxScore} marks, checking it against the passage above for accuracy — do not accept claims that contradict or aren't supported by the passage.`
        : `Score the student's answer out of ${dto.maxScore} marks.`,
    ]
      .filter(Boolean)
      .join('\n\n');

    if (!dto.diagramImageUrls?.length) return text;

    return [
      { type: 'text', text },
      ...dto.diagramImageUrls.map((url) => ({
        type: 'image_url' as const,
        imageUrl: url,
      })),
    ];
  }

  private parseResponse(text: string, dto: ScoreEssayDto): ParsedScoringResult {
    const clean = text.replace(/```json|```/g, '').trim();
    try {
      const parsed = JSON.parse(clean);
      return {
        score: Math.max(0, Math.min(Number(parsed.score) || 0, dto.maxScore)),
        feedback: parsed.feedback ?? '',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        improvements: Array.isArray(parsed.improvements)
          ? parsed.improvements
          : [],
        confidence:
          typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
        criteria: Array.isArray(parsed.criteria) ? parsed.criteria : [],
      };
    } catch (err) {
      this.logger.error(
        `Failed to parse AI scoring response as JSON: ${(err as Error).message}`,
      );
      return {
        score: 0,
        feedback:
          'The AI response could not be parsed. This attempt has been logged for review — please try scoring again.',
        strengths: [],
        improvements: [],
        confidence: 0,
        criteria: [],
      };
    }
  }

  // ─── ELABORATE (on-demand deeper feedback) ─────────────────────────────────
  //
  // The initial score's `aiFeedback` is deliberately a short 2-3 sentence
  // summary (see buildSystemPrompt's JSON shape) — cheap to generate for
  // every single submission. This is the "I want more detail" follow-up:
  // only called when a student actually asks, so it doesn't multiply the
  // cost of every scoring call. Quotes specific parts of the student's own
  // answer, explains the reasoning behind each criterion's marks, and
  // suggests a concrete rewrite of the weakest section. Cached on the row
  // (detailedFeedback) so re-opening the review screen never re-generates it.
  async elaborate(userId: string, scoreId: string): Promise<AiEssayScore> {
    const score = await this.essayScoreRepository.findOne({
      where: { id: scoreId },
    });
    if (!score) throw new NotFoundException('Score not found.');
    if (score.userId !== userId) {
      throw new NotFoundException('Score not found.');
    }
    if (score.detailedFeedback) {
      // Already generated for this student — they have it, so showing it again
      // costs no AI call and must not count another free use.
      return score;
    }

    // "More explanation after scoring / when reviewing the answer" is its own
    // admin rule (free / paid / free allowance), separate from scoring itself.
    await this.entitlements.assertAccess(userId, FeatureKey.AI_ESSAY_ELABORATE);
    await this.rateLimitService.assertWithinLimits(userId);

    // Same passage-context enrichment as the initial scoring call —
    // re-fetched here since AiEssayScore doesn't persist passage text
    // itself, only the question text.
    let passageText: string | null = null;
    if (score.questionId) {
      try {
        const question = await this.questionsService.findOne(score.questionId);
        passageText = question?.passage?.passageText ?? null;
      } catch {
        // No passage context available — elaboration still works fine.
      }
    }

    const basePrompt = await this.promptService.getActivePrompt(score.feature);
    const systemPrompt = [
      basePrompt,
      'The student has already received a score and a short summary. They now want a MUCH more ' +
        'detailed breakdown. Quote specific phrases from their actual answer (in quotation marks) ' +
        'when pointing out a strength or weakness — never speak only in generalities. For each point ' +
        'lost, explain precisely why, referencing the relevant criterion if one is given. End with a ' +
        'concrete rewritten example of the single weakest sentence or paragraph, showing what a ' +
        'stronger answer would have said there. Keep an encouraging tone throughout — this is a ' +
        'learning tool, not just a critique. Respond in plain text (not JSON), using short paragraphs ' +
        'or a few bullet points, well under 350 words.',
    ].join('\n\n');

    const userContent = [
      passageText ? `Passage the question refers to:\n${passageText}` : '',
      `Question (${score.maxScore} marks): ${score.questionText ?? '(question text unavailable)'}`,
      `Student's Answer: ${score.studentAnswer}`,
      score.modelAnswer
        ? `Mark Scheme / Model Answer:\n${score.modelAnswer}`
        : '',
      `They scored ${score.aiScore}/${score.maxScore}. Original short feedback given: "${score.aiFeedback}"`,
      score.scoringCriteria?.length
        ? `Per-criterion breakdown:\n${score.scoringCriteria
            .map(
              (c) =>
                `- ${c.criterion}: ${c.awardedPoints}/${c.maxPoints} — ${c.feedback}`,
            )
            .join('\n')}`
        : '',
      `Strengths noted: ${score.strengths.join('; ') || '(none recorded)'}`,
      `Areas to improve noted: ${score.improvements.join('; ') || '(none recorded)'}`,
      'Now give the detailed, quote-referenced elaboration described in your instructions.',
    ]
      .filter(Boolean)
      .join('\n\n');

    const result = await this.router.complete({
      feature: score.feature,
      userId,
      systemPrompt,
      messages: [{ role: 'user', content: userContent }],
      relatedEntityType: 'essay_score_elaboration',
      relatedEntityId: score.id,
      requiresVision: !!score.diagramImageUrls?.length,
    });

    score.detailedFeedback = result.text;
    return this.essayScoreRepository.save(score);
  }

  /* Per-student subject breakdown + recent scores — backs the admin
   * "Practice Scoring" per-student insight detail page. Subjects are
   * derived by joining to Question via questionId; scores with no linked
   * question (e.g. freeform practice with no question bank entry) are
   * still included in recentScores but can't contribute to a subject
   * bucket, since AiEssayScore itself has no subject column.
   */
  async getStudentInsight(userId: string): Promise<{
    studentId: string;
    subjects: { subject: string; avgScore: number; questionCount: number }[];
    recentScores: AiEssayScore[];
  }> {
    const subjectRows = await this.essayScoreRepository
      .createQueryBuilder('s')
      .innerJoin(Question, 'q', 'q.id = s.questionId')
      .where('s.userId = :userId', { userId })
      .select('q.subject', 'subject')
      .addSelect('AVG(s.aiScore / NULLIF(s.maxScore, 0) * 100)', 'avgScore')
      .addSelect('COUNT(*)', 'questionCount')
      .groupBy('q.subject')
      .orderBy('"questionCount"', 'DESC')
      .getRawMany();

    const recentScores = await this.essayScoreRepository
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .orderBy('s.gradedAt', 'DESC')
      .limit(20)
      .getMany();

    return {
      studentId: userId,
      subjects: subjectRows.map((r) => ({
        subject: r.subject,
        avgScore: Math.round(Number(r.avgScore) * 10) / 10,
        questionCount: Number(r.questionCount),
      })),
      recentScores,
    };
  }
}
