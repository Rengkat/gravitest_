import { Inject, Injectable } from '@nestjs/common';
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
export class AiProviderFactory {
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

  get(provider: AIProvider): AiProviderInterface {
    const instance = this.instances.get(provider);
    if (!instance) throw new Error(`No provider registered for "${provider}"`);
    return instance;
  }
}
