import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type Redis from 'ioredis';
import { IsNull, Repository } from 'typeorm';

import { AiExplanationCache } from './entities/ai-explanation-cache.entity';
import { AiRouterService } from './ai-router.service';
import { AiPromptService } from './ai-prompt.service';
import { AiRateLimitService } from './ai-rate-limit.service';
import { ExplainQuestionDto } from './dto/explain-question.dto';
import { QuestionsService } from 'src/questions/questions.service';
import { AIFeature } from 'src/common/enums/enums';
import { REDIS_CLIENT } from 'src/redis/redis.module';

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

    // Optional: without Redis the only effect is that re-opening an
    // explanation counts against a free allowance again (fail-safe, never open).
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: Redis,
  ) {}

  async explain(
    userId: string,
    dto: ExplainQuestionDto,
  ): Promise<{ explanation: string; cached: boolean }> {
    const detailLevel = dto.detailLevel ?? 'standard';

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

    const result = await this.router.complete({
      feature: AIFeature.SABI_EXPLAIN,
      userId,
      systemPrompt: basePrompt,
      messages: [{ role: 'user', content: userContent }],
      relatedEntityType: 'explanation',
      relatedEntityId: dto.questionId,
    });

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
      existingExplanation
        ? `Existing explanation on file: ${existingExplanation}`
        : '',
      studentAnswerLabel
        ? `The student answered "${studentAnswerLabel}". Explain specifically why that option is wrong (if it is) and why "${correctLabel}" is correct.`
        : `Explain clearly why "${correctLabel}" is the correct answer and briefly why the other options are wrong.`,
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
