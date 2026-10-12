import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiSystemPrompt } from './entities/ai-system-prompt.entity';
import { AIFeature } from 'src/common/enums/enums';

// Hardcoded fallbacks so the system works before an admin configures
// anything in AiSystemPrompt. Feature services layer their own dynamic
// instructions (subject/difficulty, JSON schema, question context, etc.)
// on top of whatever this returns.
const DEFAULT_PROMPTS: Partial<Record<AIFeature, string>> = {
  [AIFeature.SABI_TUTOR]:
    'You are Sabi, a friendly and patient AI tutor for Nigerian secondary school and JAMB/WAEC/NECO students. Explain concepts clearly, check understanding, and encourage the student. Keep answers focused on the subject at hand.',
  [AIFeature.SABI_EXPLAIN]:
    'You are an expert Nigerian secondary school and JAMB examiner. Explain why the correct answer to a multiple-choice question is correct, and why the other options are wrong, in simple and encouraging language.',
  [AIFeature.PRACTICE_SCORING]:
    'You are an expert Nigerian secondary school and JAMB examiner. Score student answers fairly and provide constructive, encouraging feedback.',
  [AIFeature.EXAM_GRADING]:
    'You are an expert Nigerian secondary school and JAMB examiner grading a formal exam submission. Be rigorous and consistent, following any mark scheme provided exactly.',
};

@Injectable()
export class AiPromptService {
  constructor(
    @InjectRepository(AiSystemPrompt)
    private readonly promptRepository: Repository<AiSystemPrompt>,
  ) {}

  async getActivePrompt(feature: AIFeature): Promise<string> {
    const row = await this.promptRepository.findOne({
      where: { feature, isActive: true },
      order: { version: 'DESC' },
    });
    return row?.prompt ?? DEFAULT_PROMPTS[feature] ?? 'You are a helpful educational assistant.';
  }

  async listForFeature(feature: AIFeature): Promise<AiSystemPrompt[]> {
    return this.promptRepository.find({ where: { feature }, order: { version: 'DESC' } });
  }

  async create(params: {
    name: string;
    feature: AIFeature;
    prompt: string;
    createdBy: string;
    activate?: boolean;
  }): Promise<AiSystemPrompt> {
    const latest = await this.promptRepository.findOne({
      where: { feature: params.feature },
      order: { version: 'DESC' },
    });

    if (params.activate !== false) {
      await this.promptRepository.update({ feature: params.feature }, { isActive: false });
    }

    const row = this.promptRepository.create({
      name: params.name,
      feature: params.feature,
      prompt: params.prompt,
      version: (latest?.version ?? 0) + 1,
      isActive: params.activate !== false,
      createdBy: params.createdBy,
    });
    return this.promptRepository.save(row);
  }

  async activate(id: string): Promise<AiSystemPrompt> {
    const row = await this.promptRepository.findOne({ where: { id } });
    if (!row) throw new Error(`Prompt "${id}" not found.`);
    await this.promptRepository.update({ feature: row.feature }, { isActive: false });
    row.isActive = true;
    return this.promptRepository.save(row);
  }
}
