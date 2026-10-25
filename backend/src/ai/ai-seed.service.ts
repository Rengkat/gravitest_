import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiModelConfig } from './entities/ai-model-config.entity';
import { AiFeatureModelMapping } from './entities/ai-feature-model-mapping.entity';
import { AIFeature, AIProvider } from 'src/common/enums/enums';

// Routing philosophy (free-first):
//   • Text features  → Groq (fast, free plan) with Mistral's free "Experiment"
//     plan as fallback. DeepSeek V4 Flash is registered as a cheap paid
//     swap-in but not wired to any feature by default.
//   • Vision (diagram-in-essay scoring) → Gemini only. AiRouterService
//     forces AIProvider.GOOGLE models whenever requiresVision is set and
//     picks the active one with the lowest avgLatencyMs, so keep the
//     preferred vision model's latency lowest.
//
// Model ids verified against each provider's docs in Oct 2026. Provider
// catalogues churn — if a call 404s, check the provider's deprecations page
// and edit the row via /ai/admin/models (no redeploy needed).
//
// Costs are USD per 1M tokens and only feed the usage/cost log. Free tiers
// cost 0 in practice; the figures below are the paid-tier estimates so the
// log stays meaningful if you later add billing.
const MODEL_SEED: Array<Omit<AiModelConfig, 'id' | 'createdAt' | 'updatedAt'>> =
  [
    {
      modelId: 'openai/gpt-oss-120b',
      name: 'GPT-OSS 120B (Groq)',
      provider: AIProvider.GROQ,
      description:
        "Primary text model — fast, on Groq's free plan. Used for tutoring, explanations and text-only scoring.",
      costInputPerMillion: 0.15,
      costOutputPerMillion: 0.6,
      avgLatencyMs: 500,
      isActive: true,
      tags: ['fast', 'free-tier', 'primary'],
    },
    {
      modelId: 'openai/gpt-oss-20b',
      name: 'GPT-OSS 20B (Groq)',
      provider: AIProvider.GROQ,
      description: 'Smaller/faster Groq model for lightweight features.',
      costInputPerMillion: 0.075,
      costOutputPerMillion: 0.3,
      avgLatencyMs: 300,
      isActive: true,
      tags: ['fast', 'free-tier', 'cheap'],
    },
    {
      // Kept registered but INACTIVE by default: Groq now lists this model as
      // Enterprise/contact-sales and it is absent from the free-plan limits
      // table. If `GET https://api.groq.com/openai/v1/models` lists it for your
      // key, flip isActive on in the admin.
      modelId: 'llama-3.3-70b-versatile',
      name: 'Llama 3.3 70B (Groq)',
      provider: AIProvider.GROQ,
      description:
        'Original primary model. Inactive by default — enable only if your Groq key can list it.',
      costInputPerMillion: 0.59,
      costOutputPerMillion: 0.79,
      avgLatencyMs: 400,
      isActive: false,
      tags: ['fast', 'legacy'],
    },
    {
      modelId: 'mistral-small-latest',
      name: 'Mistral Small',
      provider: AIProvider.MISTRAL,
      description:
        'Fallback for text features and primary for essay scoring — large free token budget on the Experiment plan (which opts you in to data training).',
      costInputPerMillion: 0.1,
      costOutputPerMillion: 0.3,
      avgLatencyMs: 800,
      isActive: true,
      tags: ['free-tier', 'fallback'],
    },
    {
      modelId: 'deepseek-v4-flash',
      name: 'DeepSeek V4 Flash',
      provider: AIProvider.DEEPSEEK,
      description:
        'Very cheap paid swap-in (replaces the retired deepseek-chat id). Not wired to any feature by default.',
      costInputPerMillion: 0.14,
      costOutputPerMillion: 0.28,
      avgLatencyMs: 1200,
      isActive: true,
      tags: ['cheap', 'text-only'],
    },
    {
      modelId: 'gemini-3.5-flash-lite',
      name: 'Gemini 3.5 Flash-Lite',
      provider: AIProvider.GOOGLE,
      description:
        'Preferred vision model (diagram-in-essay scoring, image questions) — lowest latency among active Google models so the router picks it first.',
      costInputPerMillion: 0.1,
      costOutputPerMillion: 0.4,
      avgLatencyMs: 600,
      isActive: true,
      tags: ['vision', 'free-tier', 'primary-vision'],
    },
    {
      modelId: 'gemini-3.8-flash',
      name: 'Gemini 3.8 Flash',
      provider: AIProvider.GOOGLE,
      description:
        'Vision fallback — stronger but slower and costlier than Flash-Lite.',
      costInputPerMillion: 0.75,
      costOutputPerMillion: 3.75,
      avgLatencyMs: 1000,
      isActive: true,
      tags: ['vision', 'fallback'],
    },
  ];

const GROQ_PRIMARY = 'openai/gpt-oss-120b';
const TEXT_FALLBACK = 'mistral-small-latest';
const SCORING_PRIMARY = 'mistral-small-latest';

// Chat/explanation features: Groq first for speed, Mistral behind it.
const text = (
  feature: AIFeature,
  maxTokens: number,
  temperature: number,
): Pick<
  AiFeatureModelMapping,
  'feature' | 'primaryModelId' | 'fallbackModelId' | 'maxTokens' | 'temperature'
> => ({
  feature,
  primaryModelId: GROQ_PRIMARY,
  fallbackModelId: TEXT_FALLBACK,
  maxTokens,
  temperature,
});

// Scoring/grading: Mistral's much larger free token budget first (rubric
// prompts are long and Groq's free plan has a small daily token cap), Groq
// behind it. Diagram answers bypass this mapping and go to Gemini.
const scoring = (
  feature: AIFeature,
  maxTokens: number,
  temperature: number,
): Pick<
  AiFeatureModelMapping,
  'feature' | 'primaryModelId' | 'fallbackModelId' | 'maxTokens' | 'temperature'
> => ({
  feature,
  primaryModelId: SCORING_PRIMARY,
  fallbackModelId: GROQ_PRIMARY,
  maxTokens,
  temperature,
});

const MAPPING_SEED = [
  text(AIFeature.SABI_TUTOR, 1200, 0.7),
  text(AIFeature.SABI_EXPLAIN, 800, 0.4),
  text(AIFeature.SABI_SOLVE, 1200, 0.3),
  text(AIFeature.SABI_QUIZ, 1500, 0.6),
  text(AIFeature.SABI_ESSAY, 1500, 0.7),
  text(AIFeature.SABI_TRANSLATE, 800, 0.3),
  scoring(AIFeature.PRACTICE_SCORING, 1000, 0.2),
  scoring(AIFeature.EXAM_GRADING, 1000, 0.1),
  text(AIFeature.FEEDBACK_GENERATION, 800, 0.5),
];

// Model ids the providers have shut down. Existing databases still hold rows
// (and feature mappings) pointing at them, and the seeder never overwrites
// admin edits — so on boot we deactivate these rows and repoint ONLY the
// mappings that reference them. Mappings an admin has set to anything else
// are left alone.
const RETIRED_MODELS: Record<string, string> = {
  // Shut down 1 Jun 2026 (Google deprecations page).
  'gemini-2.0-flash': TEXT_FALLBACK,
  'gemini-2.0-flash-001': TEXT_FALLBACK,
  'gemini-2.0-flash-lite': TEXT_FALLBACK,
  'gemini-2.0-flash-lite-001': TEXT_FALLBACK,
  // Legacy alias retired 24 Jul 2026 (DeepSeek V4 migration).
  'deepseek-chat': 'deepseek-v4-flash',
  'deepseek-reasoner': 'deepseek-v4-flash',
};

/**
 * Without this, every AI endpoint 404s on a fresh deploy — AiRouterService
 * requires a AiFeatureModelMapping row per feature. Idempotent: only inserts
 * rows that don't exist, so admin edits made later via PATCH /ai/admin/...
 * are never overwritten by a restart (the one exception is retiring model
 * ids that no longer exist at the provider — see RETIRED_MODELS).
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
      const exists = await this.modelRepo.findOne({
        where: { modelId: model.modelId },
      });
      if (!exists) {
        await this.modelRepo.save(this.modelRepo.create(model));
        this.logger.log(`Seeded AI model config "${model.modelId}".`);
      }
    }

    for (const mapping of MAPPING_SEED) {
      const exists = await this.mappingRepo.findOne({
        where: { feature: mapping.feature },
      });
      if (!exists) {
        await this.mappingRepo.save(
          this.mappingRepo.create({ ...mapping, isEnabled: true }),
        );
        this.logger.log(`Seeded AI feature mapping for "${mapping.feature}".`);
      }
    }

    await this.retireShutDownModels();
  }

  private async retireShutDownModels(): Promise<void> {
    const retiredIds = Object.keys(RETIRED_MODELS);

    for (const modelId of retiredIds) {
      const row = await this.modelRepo.findOne({ where: { modelId } });
      if (row?.isActive) {
        row.isActive = false;
        await this.modelRepo.save(row);
        this.logger.warn(
          `Deactivated retired AI model "${modelId}" (provider has shut it down).`,
        );
      }
    }

    const mappings = await this.mappingRepo.find();
    for (const m of mappings) {
      let changed = false;

      if (RETIRED_MODELS[m.primaryModelId]) {
        m.primaryModelId = RETIRED_MODELS[m.primaryModelId];
        changed = true;
      }
      if (m.fallbackModelId && RETIRED_MODELS[m.fallbackModelId]) {
        m.fallbackModelId = RETIRED_MODELS[m.fallbackModelId];
        changed = true;
      }
      if (!changed) continue;

      // Avoid a pointless primary === fallback chain after remapping.
      if (m.fallbackModelId === m.primaryModelId) {
        m.fallbackModelId =
          m.primaryModelId === GROQ_PRIMARY ? TEXT_FALLBACK : GROQ_PRIMARY;
      }
      await this.mappingRepo.save(m);
      this.logger.warn(
        `Repointed "${m.feature}" away from a retired model → primary "${m.primaryModelId}", fallback "${m.fallbackModelId}".`,
      );
    }
  }
}
