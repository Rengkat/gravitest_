import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiModelConfig } from './entities/ai-model-config.entity';
import { AiFeatureModelMapping } from './entities/ai-feature-model-mapping.entity';
import { AIFeature, AIProvider } from 'src/common/enums/enums';

// Model ids matching each provider's real API. Groq is primary (fast,
// cheap, per the tech stack); Gemini Flash is fallback AND the forced
// choice whenever a call needs vision (see AiRouterService.complete's
// requiresVision handling) since Groq's llama-3.3-70b is text-only.
const MODEL_SEED: Array<Omit<AiModelConfig, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    modelId: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B (Groq)',
    provider: AIProvider.GROQ,
    description: 'Primary model — fast + cheap, used for tutoring, explanations, and text-only scoring.',
    costInputPerMillion: 0.59,
    costOutputPerMillion: 0.79,
    avgLatencyMs: 400,
    isActive: true,
    tags: ['fast', 'cheap', 'primary'],
  },
  {
    modelId: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: AIProvider.GOOGLE,
    description: 'Fallback model, and the only one used for vision tasks (diagram-in-essay scoring, image questions).',
    costInputPerMillion: 0.1,
    costOutputPerMillion: 0.4,
    avgLatencyMs: 700,
    isActive: true,
    tags: ['vision', 'cheap', 'fallback'],
  },
  // Not wired into any feature mapping by default (existing routing is
  // untouched) — registered and active so it shows up as a ready-to-use
  // option in the admin's model dropdown, since DeepSeek is one of the
  // cheapest capable models available and the operator explicitly wants
  // more cost-swap options to choose from.
  {
    modelId: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: AIProvider.DEEPSEEK,
    description: 'Extremely low cost per token — a good swap-in for tutoring/explanation if Groq pricing or availability ever changes.',
    costInputPerMillion: 0.14,
    costOutputPerMillion: 0.28,
    avgLatencyMs: 1200,
    isActive: true,
    tags: ['cheap', 'text-only'],
  },
];

// primary = Groq for everything except grading (grading defaults to
// Gemini as primary since a meaningful share of essay answers will
// include a diagram — avoids a fallback round-trip on the common case).
const MAPPING_SEED: Array<
  Pick<AiFeatureModelMapping, 'feature' | 'primaryModelId' | 'fallbackModelId' | 'maxTokens' | 'temperature'>
> = [
  { feature: AIFeature.SABI_TUTOR, primaryModelId: 'llama-3.3-70b-versatile', fallbackModelId: 'gemini-2.0-flash', maxTokens: 1200, temperature: 0.7 },
  { feature: AIFeature.SABI_EXPLAIN, primaryModelId: 'llama-3.3-70b-versatile', fallbackModelId: 'gemini-2.0-flash', maxTokens: 800, temperature: 0.4 },
  { feature: AIFeature.SABI_SOLVE, primaryModelId: 'llama-3.3-70b-versatile', fallbackModelId: 'gemini-2.0-flash', maxTokens: 1200, temperature: 0.3 },
  { feature: AIFeature.SABI_QUIZ, primaryModelId: 'llama-3.3-70b-versatile', fallbackModelId: 'gemini-2.0-flash', maxTokens: 1500, temperature: 0.6 },
  { feature: AIFeature.SABI_ESSAY, primaryModelId: 'llama-3.3-70b-versatile', fallbackModelId: 'gemini-2.0-flash', maxTokens: 1500, temperature: 0.7 },
  { feature: AIFeature.SABI_TRANSLATE, primaryModelId: 'llama-3.3-70b-versatile', fallbackModelId: 'gemini-2.0-flash', maxTokens: 800, temperature: 0.3 },
  { feature: AIFeature.PRACTICE_SCORING, primaryModelId: 'gemini-2.0-flash', fallbackModelId: 'llama-3.3-70b-versatile', maxTokens: 1000, temperature: 0.2 },
  { feature: AIFeature.EXAM_GRADING, primaryModelId: 'gemini-2.0-flash', fallbackModelId: 'llama-3.3-70b-versatile', maxTokens: 1000, temperature: 0.1 },
  { feature: AIFeature.FEEDBACK_GENERATION, primaryModelId: 'llama-3.3-70b-versatile', fallbackModelId: 'gemini-2.0-flash', maxTokens: 800, temperature: 0.5 },
];

/**
 * Without this, every AI endpoint 404s on a fresh deploy — AiRouterService
 * requires a AiFeatureModelMapping row per feature, and none existed
 * anywhere in the codebase (no seed, no migration). Idempotent: only
 * inserts rows that don't already exist, so admin edits made later via
 * PATCH /ai/admin/... are never overwritten by a restart.
 */
@Injectable()
export class AiSeedService implements OnModuleInit {
  private readonly logger = new Logger(AiSeedService.name);

  constructor(
    @InjectRepository(AiModelConfig)
    private readonly modelRepo: Repository<AiModelConfig>,
    @InjectRepository(AiFeatureModelMapping)
    private readonly mappingRepo: Repository<AiFeatureModelMapping>,
  ) {}

  async onModuleInit() {
    for (const model of MODEL_SEED) {
      const exists = await this.modelRepo.findOne({ where: { modelId: model.modelId } });
      if (!exists) {
        await this.modelRepo.save(this.modelRepo.create(model));
        this.logger.log(`Seeded AI model config "${model.modelId}".`);
      }
    }

    for (const mapping of MAPPING_SEED) {
      const exists = await this.mappingRepo.findOne({ where: { feature: mapping.feature } });
      if (!exists) {
        await this.mappingRepo.save(this.mappingRepo.create({ ...mapping, isEnabled: true }));
        this.logger.log(`Seeded AI feature mapping for "${mapping.feature}".`);
      }
    }
  }
}
