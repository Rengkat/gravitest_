import {
  ForbiddenException,
  HttpException,
  HttpStatus,
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
import { AiImageError, AiImageService, type LoadedImage } from './ai-image.service';
import type { AiContentPart } from './interfaces/ai-provider.interface';
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
    private readonly images: AiImageService,
    private readonly dataSource: DataSource,

    // Optional: without Redis the only effect is that re-opening an
    // explanation counts against a free allowance again (fail-safe, never open).
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: Redis,
  ) {}

  async explain(
    userId: string,
    dto: ExplainQuestionDto,
  ): Promise<{ explanation: string; cached: boolean; usedImages: number }> {
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

    const question = await this.questionsService.findOne(dto.questionId);
    if (!question) throw new NotFoundException('Question not found.');

    // Every image the model must see to understand this question (question diagram, passage diagram,
    // image options, explanation diagram). Empty for ordinary text questions.
    let imageRefs;
    try {
      imageRefs = this.images.collectQuestionImages(question);
    } catch (err) {
      throw this.imageProblem(err, dto.questionId);
    }
    const needsVision = imageRefs.length > 0;

    // 2. Shared cache — costs nothing, so no token/request limits apply. An explanation for a question with
    //    images is only reusable if it was generated WITH those images: rows written before vision was
    //    enforced (or by a text-only fallback) were produced without seeing the diagram and are regenerated.
    const cachedRow = await this.cacheRepository.findOne({
      where: {
        questionId: dto.questionId,
        studentAnswerLabel: dto.studentAnswerLabel ?? IsNull(),
        detailLevel,
      },
    });
    if (cachedRow && (!needsVision || cachedRow.visionUsed)) {
      cachedRow.hitCount += 1;
      await this.cacheRepository.save(cachedRow);
      return { explanation: cachedRow.explanation, cached: true, usedImages: needsVision ? imageRefs.length : 0 };
    }

    // 3. Cache miss = a real AI call: enforce the per-tier request/token caps.
    await this.rateLimitService.assertWithinLimits(userId);

    // 4. Fetch the REAL image bytes. A failure here is reported — never worked around by explaining the
    //    question as if the diagram were not there.
    let loaded: LoadedImage[] = [];
    if (needsVision) {
      try {
        loaded = await this.images.loadAll(imageRefs);
      } catch (err) {
        throw this.imageProblem(err, dto.questionId);
      }
    }

    const basePrompt = await this.promptService.getActivePrompt(AIFeature.SABI_EXPLAIN);
    const userText = this.buildUserContent(question, dto.studentAnswerLabel, detailLevel, loaded);

    let result;
    try {
      result = await this.router.complete({
        feature: AIFeature.SABI_EXPLAIN,
        userId,
        systemPrompt: basePrompt,
        messages: [
          {
            role: 'user',
            content: needsVision ? this.withImages(userText, loaded) : userText,
          },
        ],
        relatedEntityType: 'explanation',
        relatedEntityId: dto.questionId,
        requiresVision: needsVision,
      });
    } catch (err) {
      // The technical detail (provider status, body, model id) is for the logs; the student gets a short,
      // retryable message and keeps their answer and place.
      this.logger.error(
        `Explain failed for question ${dto.questionId} (vision=${needsVision}, images=${loaded.length}): ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          code: 'ai_unavailable',
          retryable: true,
          message: needsVision
            ? "Sabi couldn't study this diagram just now. Your answer is saved — please try again."
            : "Sabi couldn't prepare this explanation just now. Your answer is saved — please try again.",
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (cachedRow) {
      // Replace the stale row (unique per question/answer/level) instead of inserting a duplicate.
      cachedRow.explanation = result.text;
      cachedRow.modelId = result.modelConfig.modelId;
      cachedRow.visionUsed = needsVision;
      cachedRow.hitCount = 1;
      await this.cacheRepository.save(cachedRow);
    } else {
      await this.cacheRepository.save(
        this.cacheRepository.create({
          questionId: dto.questionId,
          studentAnswerLabel: dto.studentAnswerLabel ?? null,
          detailLevel,
          explanation: result.text,
          modelId: result.modelConfig.modelId,
          visionUsed: needsVision,
          hitCount: 1,
        }),
      );
    }

    return { explanation: result.text, cached: false, usedImages: loaded.length };
  }

  /** Turns an image problem into a student-safe HTTP error; the technical detail only goes to the log. */
  private imageProblem(err: unknown, questionId: string): HttpException {
    if (err instanceof AiImageError) {
      this.logger.error(`Image problem for question ${questionId} [${err.code}]: ${err.technical}`);
      const retryable = err.code === 'image_unreachable';
      const status = retryable ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.UNPROCESSABLE_ENTITY;
      return new HttpException(
        { statusCode: status, code: err.code, retryable, message: err.publicMessage },
        status,
      );
    }
    this.logger.error(`Unexpected image error for question ${questionId}: ${(err as Error).message}`, (err as Error).stack);
    return new HttpException(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'image_unreachable',
        retryable: true,
        message: "Sabi couldn't load this question's diagram. Please try again in a moment.",
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  /** Interleave each image with a caption so the model can tell "Image 2" from "Image 1". */
  private withImages(text: string, images: LoadedImage[]): AiContentPart[] {
    return [
      { type: 'text', text },
      ...images.flatMap((img, i): AiContentPart[] => [
        { type: 'text', text: `Image ${i + 1} — ${img.label}:` },
        { type: 'image_data', mimeType: img.mimeType, data: img.data },
      ]),
    ];
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
      .addSelect('s.startedAt', 'startedAt')
      .addSelect('s.allowedDurationSeconds', 'allowedDurationSeconds')
      .getRawMany<{
        mode: ExamMode;
        answerId: string | null;
        startedAt: Date;
        allowedDurationSeconds: number | null;
      }>();

    const open: OpenSessionUse[] = rows.map((r) => ({
      mode: r.mode === ExamMode.MOCK ? 'mock' : 'practice',
      answered: !!r.answerId,
      startedAt: r.startedAt,
      allowedDurationSeconds: r.allowedDurationSeconds,
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
    images: LoadedImage[] = [],
  ): string {
    const options = (question.options ?? [])
      .map((o: any) => `${o.label}) ${o.text}`)
      .join('\n');
    const correctLabel = question.answer?.correctLabel;
    const existingExplanation = question.explanations?.[0]?.text;

    const passage = question.passage;
    const parts = [
      passage?.passageText
        ? `Passage the question refers to:\n${passage.instructions ? `${passage.instructions}\n` : ''}${passage.passageText}`
        : '',
      `Question: ${question.questionText}`,
      images.length
        ? `The question comes with ${images.length} image${images.length === 1 ? '' : 's'}, attached after this message in this order:\n` +
          images.map((img, i) => `  Image ${i + 1}: ${img.label}`).join('\n') +
          '\nLook at every image carefully BEFORE answering. Read all of its labels, letters, angles, lengths, axes, ' +
          'values, structures and markings, and use what you actually see in your explanation. Refer to parts of the ' +
          "diagram by the labels printed on it. If something in an image is unclear or unreadable, say so — never guess " +
          'or invent details.'
        : '',
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
