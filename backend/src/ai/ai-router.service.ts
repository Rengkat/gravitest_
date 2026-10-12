import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AiModelConfig } from './entities/ai-model-config.entity';
import { AiFeatureModelMapping } from './entities/ai-feature-model-mapping.entity';
import { AiUsageLog } from './entities/ai-usage-log.entity';
import { AiProviderFactory } from './providers/ai-provider.factory';
import { AIFeature, AIProvider } from 'src/common/enums/enums';
import {
  AiChatMessage,
  AiCompletionResult,
  AiStreamChunk,
} from './interfaces/ai-provider.interface';

export interface RouteParams {
  feature: AIFeature;
  userId: string;
  systemPrompt: string;
  messages: AiChatMessage[];
  jsonMode?: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  // When true, forces routing to a vision-capable model regardless of the
  // feature's configured mapping — used for essay answers that include a
  // diagram. Only GoogleProvider (Gemini) actually interprets images
  // today, so this ignores mapping.primaryModelId/fallbackModelId
  // entirely and picks the best active AIProvider.GOOGLE model instead.
  requiresVision?: boolean;
}

@Injectable()
export class AiRouterService {
  private readonly logger = new Logger(AiRouterService.name);

  constructor(
    @InjectRepository(AiModelConfig)
    private readonly modelConfigRepository: Repository<AiModelConfig>,

    @InjectRepository(AiFeatureModelMapping)
    private readonly mappingRepository: Repository<AiFeatureModelMapping>,

    @InjectRepository(AiUsageLog)
    private readonly usageLogRepository: Repository<AiUsageLog>,

    private readonly providerFactory: AiProviderFactory,
  ) {}

  // Non-streaming call — used by essay scoring and MCQ explanation, and
  // available for chat too if a client doesn't want SSE.
  async complete(
    params: RouteParams,
  ): Promise<AiCompletionResult & { modelConfig: AiModelConfig; costUsd: number }> {
    const { mapping, primary, fallback } = params.requiresVision
      ? await this.resolveVisionModel(params.feature)
      : await this.resolveModels(params.feature);

    try {
      const provider = this.providerFactory.get(primary.provider);
      const result = await provider.complete({
        modelId: primary.modelId,
        systemPrompt: params.systemPrompt,
        messages: params.messages,
        maxTokens: mapping.maxTokens ?? undefined,
        temperature: mapping.temperature != null ? Number(mapping.temperature) : undefined,
        jsonMode: params.jsonMode,
      });
      const costUsd = await this.logUsage(params, primary, result, true, false);
      return { ...result, modelConfig: primary, costUsd };
    } catch (primaryErr) {
      this.logger.warn(`Primary model "${primary.modelId}" failed: ${(primaryErr as Error).message}`);

      if (!fallback) {
        await this.logFailure(params, primary, primaryErr as Error);
        throw new InternalServerErrorException('AI service is temporarily unavailable.');
      }

      try {
        const provider = this.providerFactory.get(fallback.provider);
        const result = await provider.complete({
          modelId: fallback.modelId,
          systemPrompt: params.systemPrompt,
          messages: params.messages,
          maxTokens: mapping.maxTokens ?? undefined,
          temperature: mapping.temperature != null ? Number(mapping.temperature) : undefined,
          jsonMode: params.jsonMode,
        });
        const costUsd = await this.logUsage(params, fallback, result, true, true);
        return { ...result, modelConfig: fallback, costUsd };
      } catch (fallbackErr) {
        await this.logFailure(params, fallback, fallbackErr as Error);
        throw new InternalServerErrorException('AI service is temporarily unavailable.');
      }
    }
  }

  // Streaming call — used by the chat tutor for a ChatGPT-like typing
  // effect. Falls back to the secondary model if the PRIMARY fails before
  // yielding its first chunk; once streaming has started, a mid-stream
  // failure is surfaced to the caller rather than silently restarted
  // (avoids duplicating partially-streamed text).
  async *stream(
    params: RouteParams,
  ): AsyncGenerator<AiStreamChunk & { modelId?: string; costUsd?: number }> {
    const { mapping, primary, fallback } = await this.resolveModels(params.feature);
    const start = Date.now();

    const buildGenerator = (m: AiModelConfig) =>
      this.providerFactory.get(m.provider).stream({
        modelId: m.modelId,
        systemPrompt: params.systemPrompt,
        messages: params.messages,
        maxTokens: mapping.maxTokens ?? undefined,
        temperature: mapping.temperature != null ? Number(mapping.temperature) : undefined,
      });

    let model = primary;
    let usedFallback = false;
    let generator: AsyncGenerator<AiStreamChunk>;
    let primed: IteratorResult<AiStreamChunk>;

    try {
      generator = buildGenerator(primary);
      // Prime the generator so a connection-level failure surfaces here,
      // before we've yielded anything to the caller.
      primed = await generator.next();
    } catch (primaryErr) {
      if (!fallback) {
        await this.logFailure(params, primary, primaryErr as Error);
        throw new InternalServerErrorException('AI service is temporarily unavailable.');
      }
      this.logger.warn(
        `Primary stream model "${primary.modelId}" failed, falling back: ${(primaryErr as Error).message}`,
      );
      model = fallback;
      usedFallback = true;
      generator = buildGenerator(fallback);
      primed = await generator.next();
    }

    let fullText = '';
    let tokensInput = 0;
    let tokensOutput = 0;

    try {
      let current = primed;
      while (!current.done) {
        const chunk = current.value;
        if (chunk.delta) {
          fullText += chunk.delta;
          yield { delta: chunk.delta, done: false, modelId: model.modelId };
        }
        if (chunk.done) {
          tokensInput = chunk.tokensInput ?? 0;
          tokensOutput = chunk.tokensOutput ?? 0;
          break;
        }
        current = await generator.next();
      }
    } catch (streamErr) {
      await this.logFailure(params, model, streamErr as Error);
      throw streamErr;
    }

    const costUsd = await this.logUsage(
      params,
      model,
      { text: fullText, tokensInput, tokensOutput, responseTimeMs: Date.now() - start, modelId: model.modelId },
      true,
      usedFallback,
    );

    yield { delta: '', done: true, tokensInput, tokensOutput, costUsd, modelId: model.modelId };
  }

  // ─── PRIVATE HELPERS ────────────────────────────────────────────────────────

  /**
   * Vision requests bypass the feature's normal mapping row entirely —
   * we still read `mapping` for its maxTokens/temperature settings (so
   * admin-configured generation params still apply), but primary/fallback
   * are forced to active AIProvider.GOOGLE models regardless of what's
   * configured, since only GoogleProvider actually looks at image parts.
   */
  private async resolveVisionModel(
    feature: AIFeature,
  ): Promise<{ mapping: AiFeatureModelMapping; primary: AiModelConfig; fallback: AiModelConfig | null }> {
    const mapping = await this.mappingRepository.findOne({ where: { feature } });
    if (!mapping || !mapping.isEnabled) {
      throw new NotFoundException(`AI feature "${feature}" is not configured or is disabled.`);
    }

    const googleModels = await this.modelConfigRepository.find({
      where: { provider: AIProvider.GOOGLE, isActive: true },
      order: { avgLatencyMs: 'ASC' },
    });

    if (!googleModels.length) {
      throw new InternalServerErrorException(
        'No active vision-capable (Google/Gemini) model is configured — diagram scoring is unavailable until one is added via /ai/admin/models.',
      );
    }

    return { mapping, primary: googleModels[0], fallback: googleModels[1] ?? null };
  }

  private async resolveModels(
    feature: AIFeature,
  ): Promise<{ mapping: AiFeatureModelMapping; primary: AiModelConfig; fallback: AiModelConfig | null }> {
    const mapping = await this.mappingRepository.findOne({ where: { feature } });
    if (!mapping || !mapping.isEnabled) {
      throw new NotFoundException(`AI feature "${feature}" is not configured or is disabled.`);
    }

    const primary = await this.modelConfigRepository.findOne({
      where: { modelId: mapping.primaryModelId, isActive: true },
    });
    if (!primary) {
      throw new NotFoundException(
        `Primary model "${mapping.primaryModelId}" for feature "${feature}" is missing or inactive.`,
      );
    }

    const fallback = mapping.fallbackModelId
      ? await this.modelConfigRepository.findOne({
          where: { modelId: mapping.fallbackModelId, isActive: true },
        })
      : null;

    return { mapping, primary, fallback };
  }

  private computeCostUsd(model: AiModelConfig, tokensInput: number, tokensOutput: number): number {
    const inputCost = (tokensInput / 1_000_000) * Number(model.costInputPerMillion);
    const outputCost = (tokensOutput / 1_000_000) * Number(model.costOutputPerMillion);
    return Number((inputCost + outputCost).toFixed(6));
  }

  private async logUsage(
    params: RouteParams,
    model: AiModelConfig,
    result: AiCompletionResult,
    success: boolean,
    usedFallback: boolean,
  ): Promise<number> {
    const costUsd = this.computeCostUsd(model, result.tokensInput, result.tokensOutput);
    await this.usageLogRepository.save(
      this.usageLogRepository.create({
        userId: params.userId,
        feature: params.feature,
        modelId: model.modelId,
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        costUsd,
        responseTimeMs: result.responseTimeMs,
        success,
        usedFallback,
        relatedEntityType: params.relatedEntityType ?? null,
        relatedEntityId: params.relatedEntityId ?? null,
      }),
    );
    return costUsd;
  }

  private async logFailure(params: RouteParams, model: AiModelConfig, error: Error): Promise<void> {
    await this.usageLogRepository.save(
      this.usageLogRepository.create({
        userId: params.userId,
        feature: params.feature,
        modelId: model.modelId,
        success: false,
        errorMessage: error.message?.slice(0, 500),
        relatedEntityType: params.relatedEntityType ?? null,
        relatedEntityId: params.relatedEntityId ?? null,
      }),
    );
  }
}
