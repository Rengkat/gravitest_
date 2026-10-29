import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type Redis from 'ioredis';
import { DataSource, IsNull, Repository } from 'typeorm';

import { AiExplanationCache } from './entities/ai-explanation-cache.entity';
import { AiRouterService } from './ai-router.service';
import { AiPromptService } from './ai-prompt.service';
import { AiRateLimitService } from './ai-rate-limit.service';
import { ExplainQuestionDto } from './dto/explain-question.dto';
import { QuestionsService } from 'src/questions/questions.service';
import { AIFeature } from 'src/common/enums/enums';
import { REDIS_CLIENT } from 'src/redis/redis.module';
import { SessionQuestion } from 'src/students/entities/session-questions.entity';
import { StudentProfile } from 'src/students/entities/student-profile.entity';
import { ExamMode, SessionStatus } from 'src/common/enums/enums';
import { decideExplainAccess, type OpenSessionUse } from './utils/explain-access.util';

// How long "this student already used a free allowance on this exact
// explanation" is remembered. Re-opening the same question inside this window
// does not burn a second free use.
const UNLOCK_TTL_SECONDS = 24 * 60 * 60;

@Injectable()
export class AiExplainService {
  private readonly logger = new Logger(AiExplainService.name);

  constructor(
    @InjectRepository(AiExplanationCache)
    private readonly cacheRepository: Repository<AiExplanationCache>,

    private readonly router: AiRouterService,
    private readonly promptService: AiPromptService,
    private readonly rateLimitService: AiRateLimitService,
    private readonly questionsService: QuestionsService,
    private readonly dataSource: DataSource,

    // Optional: without Redis the only effect is that re-opening an
    // explanation counts against a free allowance again (fail-safe, never open).
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: Redis,
  ) {}

  async explain(
    userId: string,
    dto: ExplainQuestionDto,
  ): Promise<{ explanation: string; cached: boolean }> {
    const detailLevel = dto.detailLevel ?? 'standard';

    // 0. SERVER-SIDE ANSWER-REVEAL GUARD. An explanation states the correct
    //    answer, so it must be refused while an exam containing this question
    //    is open, and (in practice) until the student has attempted it. Derived
    //    from the student's own open sessions, so it cannot be dodged by
    //    omitting or forging a client-supplied session id.
    await this.assertExplainAllowed(userId, dto.questionId);

    // 1. ACCESS FIRST. Explanations are cached and shared across students, so
    //    checking access only on a cache miss would hand every cached
    //    explanation to free users for nothing. The first explanation and
    //    "Explain more" are separate admin rules (free / paid / free allowance).
    const unlockKey = `ai:explain:unlock:${userId}:${dto.questionId}:${dto.studentAnswerLabel ?? '-'}:${detailLevel}`;
    const alreadyUnlocked = await this.wasUnlocked(unlockKey);
    await this.rateLimitService.assertFeatureAllowedForTier(
      userId,
      detailLevel === 'detailed' ? 'explain_more' : 'explain',
      { alreadyUnlocked },
    );
    if (!alreadyUnlocked) await this.markUnlocked(unlockKey);

    // 2. Shared cache — costs nothing, so no token/request limits apply.
    const cached = await this.cacheRepository.findOne({
      where: {
        questionId: dto.questionId,
        studentAnswerLabel: dto.studentAnswerLabel ?? IsNull(),
        detailLevel,
      },
    });
    if (cached) {
      cached.hitCount += 1;
      await this.cacheRepository.save(cached);
      return { explanation: cached.explanation, cached: true };
    }

    // 3. Cache miss = a real AI call: enforce the per-tier request/token caps.
    await this.rateLimitService.assertWithinLimits(userId);

    const question = await this.questionsService.findOne(dto.questionId);
    if (!question) throw new NotFoundException('Question not found.');

    const basePrompt = await this.promptService.getActivePrompt(
      AIFeature.SABI_EXPLAIN,
    );
    const userContent = this.buildUserContent(
      question,
      dto.studentAnswerLabel,
      detailLevel,
    );

    // If the question has a diagram, the model must actually SEE it — a bare
    // URL in the prompt is not an image. Try real vision first; if no vision
    // model/image is reachable, fall back to text-only and say so explicitly so
    // the model does not pretend to have inspected the figure.
    const imageUrl: string | null = question.questionImageUrl ?? null;
    let result;
    if (imageUrl) {
      try {
        result = await this.router.complete({
          feature: AIFeature.SABI_EXPLAIN,
          userId,
          systemPrompt: basePrompt,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: userContent },
                { type: 'image_url', imageUrl },
              ],
            },
          ],
          relatedEntityType: 'explanation',
          relatedEntityId: dto.questionId,
          requiresVision: true,
        });
      } catch (err) {
        this.logger.warn(
          `Vision explain failed for question ${dto.questionId}, retrying text-only: ${(err as Error).message}`,
        );
      }
    }
    if (!result) {
      const note = imageUrl
        ? '\n\nNOTE: this question has a diagram that you cannot see. Rely only on the question text and the explanation on file; do not describe or invent details of the diagram.'
        : '';
      result = await this.router.complete({
        feature: AIFeature.SABI_EXPLAIN,
        userId,
        systemPrompt: basePrompt,
        messages: [{ role: 'user', content: userContent + note }],
        relatedEntityType: 'explanation',
        relatedEntityId: dto.questionId,
      });
    }

    const cacheRow = this.cacheRepository.create({
      questionId: dto.questionId,
      studentAnswerLabel: dto.studentAnswerLabel ?? null,
      detailLevel,
      explanation: result.text,
      modelId: result.modelConfig.modelId,
      hitCount: 1,
    });
    await this.cacheRepository.save(cacheRow);

    return { explanation: result.text, cached: false };
  }

  /** Throws 403 when the student's open sessions forbid revealing this question's answer. */
  private async assertExplainAllowed(userId: string, questionId: string): Promise<void> {
    const rows = await this.dataSource
      .getRepository(SessionQuestion)
      .createQueryBuilder('sq')
      .innerJoin('sq.examSession', 's')
      .innerJoin(StudentProfile, 'p', 'p.id = s.studentProfileId')
      .leftJoin('sq.studentAnswer', 'a')
      .where('sq.questionId = :questionId', { questionId })
      .andWhere('p.user_id = :userId', { userId })
      .andWhere('s.status = :status', { status: SessionStatus.IN_PROGRESS })
      .select('s.mode', 'mode')
      .addSelect('a.id', 'answerId')
      .getRawMany<{ mode: ExamMode; answerId: string | null }>();

    const open: OpenSessionUse[] = rows.map((r) => ({
      mode: r.mode === ExamMode.MOCK ? 'mock' : 'practice',
      answered: !!r.answerId,
    }));
    const decision = decideExplainAccess(open);
    if (!decision.allowed) {
      throw new ForbiddenException({ code: decision.reason, message: decision.message });
    }
  }

  private async wasUnlocked(key: string): Promise<boolean> {
    if (!this.redis) return false;
    try {
      return (await this.redis.exists(key)) === 1;
    } catch (err) {
      this.logger.warn(
        `explain unlock lookup failed (counting as a fresh use): ${(err as Error).message}`,
      );
      return false;
    }
  }

  private async markUnlocked(key: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.set(key, '1', 'EX', UNLOCK_TTL_SECONDS);
    } catch (err) {
      this.logger.warn(
        `explain unlock write failed: ${(err as Error).message}`,
      );
    }
  }

  private buildUserContent(
    question: any,
    studentAnswerLabel: string | undefined,
    detailLevel: 'standard' | 'detailed',
  ): string {
    const options = (question.options ?? [])
      .map((o: any) => `${o.label}) ${o.text}`)
      .join('\n');
    const correctLabel = question.answer?.correctLabel;
    const existingExplanation = question.explanations?.[0]?.text;

    const parts = [
      `Question: ${question.questionText}`,
      options ? `Options:\n${options}` : '',
      correctLabel ? `Correct answer: ${correctLabel}` : '',
      question.modelAnswer
        ? `Model answer / mark scheme:\n${question.modelAnswer}`
        : '',
      existingExplanation
        ? `Existing explanation on file: ${existingExplanation}`
        : '',
      studentAnswerLabel
        ? `The student answered "${studentAnswerLabel}". Explain specifically why that option is wrong (if it is) and why "${correctLabel}" is correct.`
        : correctLabel
          ? `Explain clearly why "${correctLabel}" is the correct answer and briefly why the other options are wrong.`
          : 'This is a written (theory/practical) question. Explain step by step how to reach the correct answer, the key ideas and marks a strong answer must contain, and the most common mistakes.',
      'The "explanation on file" (when present) is the official, authoritative explanation. Build on it: ' +
        'never contradict it, never change the correct answer, and do not invent facts it does not support. ' +
        'Write in Markdown (short headings, numbered steps, bullet lists, **bold** key terms); put maths in \\( \\) or \\[ \\] LaTeX.',
      'Keep the explanation encouraging and easy to follow for a Nigerian secondary school / JAMB student.',
    ];


    if (detailLevel === 'detailed') {
      parts.push(
        'The student already saw a short explanation and tapped "Explain more" for a deeper one. ' +
          'This time: walk through the reasoning step by step, work through a similar example if the ' +
          'topic allows it (e.g. a parallel calculation, an analogous sentence), name the specific ' +
          'misconception that leads students to each wrong option, and end with one related concept ' +
          'or tip worth remembering for similar questions. It is fine for this to be noticeably longer ' +
          'than a normal answer — thoroughness is the point.',
      );
    }

    return parts.filter(Boolean).join('\n\n');
  }
}
