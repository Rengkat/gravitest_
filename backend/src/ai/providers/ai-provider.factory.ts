import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { AIProvider } from 'src/common/enums/enums';
import { AiProvider as AiProviderInterface } from '../interfaces/ai-provider.interface';
import { OpenAiCompatibleProvider } from './openai-compatible.provider';
import { AnthropicProvider } from './anthropic.provider';
import { GoogleProvider } from './google.provider';
import aiConfig from 'src/config/aiConfig';

// One instance per provider, built once from config and reused —
// AiRouterService asks this factory for a provider by enum value and
// never touches API keys/base URLs itself.
@Injectable()
export class AiProviderFactory implements OnModuleInit {
  private readonly logger = new Logger(AiProviderFactory.name);
  private readonly instances = new Map<AIProvider, AiProviderInterface>();

  constructor(
    @Inject(aiConfig.KEY) private readonly conf: ConfigType<typeof aiConfig>,
  ) {
    this.instances.set(
      AIProvider.OPENAI,
      new OpenAiCompatibleProvider(
        this.conf.openai.baseUrl,
        this.conf.openai.apiKey,
        'OpenAI',
      ),
    );
    this.instances.set(
      AIProvider.ANTHROPIC,
      new AnthropicProvider(
        this.conf.anthropic.baseUrl,
        this.conf.anthropic.apiKey,
      ),
    );
    this.instances.set(
      AIProvider.GOOGLE,
      new GoogleProvider(this.conf.google.baseUrl, this.conf.google.apiKey),
    );
    this.instances.set(
      AIProvider.DEEPSEEK,
      new OpenAiCompatibleProvider(
        this.conf.deepseek.baseUrl,
        this.conf.deepseek.apiKey,
        'DeepSeek',
      ),
    );
    this.instances.set(
      AIProvider.MISTRAL,
      new OpenAiCompatibleProvider(
        this.conf.mistral.baseUrl,
        this.conf.mistral.apiKey,
        'Mistral',
      ),
    );
    this.instances.set(
      AIProvider.GROQ,
      new OpenAiCompatibleProvider(
        this.conf.groq.baseUrl,
        this.conf.groq.apiKey,
        'Groq',
      ),
    );
    this.instances.set(
      AIProvider.OPENROUTER,
      new OpenAiCompatibleProvider(
        this.conf.openrouter.baseUrl,
        this.conf.openrouter.apiKey,
        'OpenRouter',
      ),
    );
    this.instances.set(
      AIProvider.OLLAMA,
      new OpenAiCompatibleProvider(
        this.conf.ollama.baseUrl,
        this.conf.ollama.apiKey,
        'Ollama',
      ),
    );
  }

  /**
   * One line at boot so "why is the AI not answering?" is answerable from the
   * logs: which providers have an API key, and which don't. Names only —
   * key values are never logged.
   */
  onModuleInit(): void {
    const keys: Array<[string, string | undefined]> = [
      ['groq', this.conf.groq.apiKey],
      ['mistral', this.conf.mistral.apiKey],
      ['google', this.conf.google.apiKey],
      ['deepseek', this.conf.deepseek.apiKey],
      ['openai', this.conf.openai.apiKey],
      ['anthropic', this.conf.anthropic.apiKey],
      ['openrouter', this.conf.openrouter.apiKey],
    ];
    const withKey = keys.filter(([, k]) => k).map(([n]) => n);
    const without = keys.filter(([, k]) => !k).map(([n]) => n);
    this.logger.log(
      `AI providers with an API key: ${withKey.join(', ') || 'none'}`,
    );
    if (without.length) {
      this.logger.warn(
        `AI providers WITHOUT a key (models on them will fail until it is set): ${without.join(', ')}`,
      );
    }
  }

  get(provider: AIProvider): AiProviderInterface {
    const instance = this.instances.get(provider);
    if (!instance) throw new Error(`No provider registered for "${provider}"`);
    return instance;
  }
}
