import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AiConversation } from './entities/ai-conversation.entity';
import { AiMessage } from './entities/ai-message.entity';
import { AiRouterService } from './ai-router.service';
import { AiPromptService } from './ai-prompt.service';
import { AiRateLimitService } from './ai-rate-limit.service';
import { SendMessageDto } from './dto/send-message.dto';
import {
  RateConversationDto,
  FlagConversationDto,
} from './dto/conversation-feedback.dto';
import {
  AIConversationStatus,
  AIFeature,
  AIMessageRole,
} from 'src/common/enums/enums';
import {
  AiChatMessage,
  AiStreamChunk,
} from './interfaces/ai-provider.interface';

const HISTORY_WINDOW = 12; // last N messages sent as context, matching your useChat.ts

@Injectable()
export class AiTutorService {
  constructor(
    @InjectRepository(AiConversation)
    private readonly conversationRepository: Repository<AiConversation>,

    @InjectRepository(AiMessage)
    private readonly messageRepository: Repository<AiMessage>,

    private readonly router: AiRouterService,
    private readonly promptService: AiPromptService,
    private readonly rateLimitService: AiRateLimitService,
  ) {}

  // Non-streaming send — full response in one shot.
  async sendMessage(
    userId: string,
    dto: SendMessageDto,
  ): Promise<{ conversation: AiConversation; message: AiMessage }> {
    await this.rateLimitService.assertFeatureAllowedForTier(userId, 'tutor');
    await this.rateLimitService.assertWithinLimits(userId);

    const conversation = await this.getOrCreateConversation(userId, dto);
    const userMessage = await this.saveMessage(
      conversation,
      AIMessageRole.USER,
      dto.message,
    );

    const systemPrompt = await this.buildSystemPrompt(conversation, dto);
    const history = await this.loadHistory(conversation.id);

    const result = await this.router.complete({
      feature: AIFeature.SABI_TUTOR,
      userId,
      systemPrompt,
      messages: history,
      relatedEntityType: 'conversation',
      relatedEntityId: conversation.id,
    });

    const assistantMessage = await this.saveMessage(
      conversation,
      AIMessageRole.ASSISTANT,
      result.text,
      {
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        responseTimeMs: result.responseTimeMs,
        modelId: result.modelConfig.modelId,
        costUsd: result.costUsd,
      },
    );

    await this.touchConversation(
      conversation,
      result.modelConfig.modelId,
      result.tokensInput + result.tokensOutput,
      result.costUsd,
    );

    return { conversation, message: assistantMessage };
  }

  // Streaming send — used by the SSE controller endpoint for a live typing
  // effect. Persists the full assistant message once the stream completes.
  async *streamMessage(
    userId: string,
    dto: SendMessageDto,
  ): AsyncGenerator<AiStreamChunk & { conversationId: string }> {
    await this.rateLimitService.assertFeatureAllowedForTier(userId, 'tutor');
    await this.rateLimitService.assertWithinLimits(userId);

    const conversation = await this.getOrCreateConversation(userId, dto);
    await this.saveMessage(conversation, AIMessageRole.USER, dto.message);

    const systemPrompt = await this.buildSystemPrompt(conversation, dto);
    const history = await this.loadHistory(conversation.id);

    let fullText = '';
    let finalModelId = conversation.lastModelId ?? '';
    let tokensInput = 0;
    let tokensOutput = 0;
    let costUsd = 0;

    for await (const chunk of this.router.stream({
      feature: AIFeature.SABI_TUTOR,
      userId,
      systemPrompt,
      messages: history,
      relatedEntityType: 'conversation',
      relatedEntityId: conversation.id,
    })) {
      if (chunk.delta) fullText += chunk.delta;
      if (chunk.modelId) finalModelId = chunk.modelId;
      if (chunk.done) {
        tokensInput = chunk.tokensInput ?? 0;
        tokensOutput = chunk.tokensOutput ?? 0;
        costUsd = chunk.costUsd ?? 0;
      }
      yield { ...chunk, conversationId: conversation.id };
    }

    await this.saveMessage(conversation, AIMessageRole.ASSISTANT, fullText, {
      tokensInput,
      tokensOutput,
      responseTimeMs: 0,
      modelId: finalModelId,
      costUsd,
    });
    await this.touchConversation(
      conversation,
      finalModelId,
      tokensInput + tokensOutput,
      costUsd,
    );
  }

  async listConversations(userId: string): Promise<AiConversation[]> {
    return this.conversationRepository.find({
      where: { userId, feature: AIFeature.SABI_TUTOR },
      order: { lastActivityAt: 'DESC' },
    });
  }

  async getConversation(userId: string, id: string): Promise<AiConversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['messages'],
    });
    if (!conversation) throw new NotFoundException('Conversation not found.');
    if (conversation.userId !== userId)
      throw new ForbiddenException('Not your conversation.');
    conversation.messages.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    return conversation;
  }

  /** Rename a conversation. Ownership is enforced by getConversation (404/403). */
  async renameConversation(
    userId: string,
    id: string,
    title: string,
  ): Promise<{ id: string; title: string }> {
    const conversation = await this.getConversation(userId, id);
    const clean = title.trim();
    if (!clean) throw new BadRequestException('Title cannot be empty.');
    conversation.title = clean.slice(0, 100);
    await this.conversationRepository.save(conversation);
    return { id: conversation.id, title: conversation.title };
  }

  async deleteConversation(
    userId: string,
    id: string,
  ): Promise<{ id: string }> {
    const conversation = await this.getConversation(userId, id);
    await this.conversationRepository.delete(conversation.id);
    return { id };
  }

  async rate(
    userId: string,
    id: string,
    dto: RateConversationDto,
  ): Promise<AiConversation> {
    const conversation = await this.getConversation(userId, id);
    conversation.userRating = dto.rating;
    conversation.userFeedback = dto.feedback ?? null;
    return this.conversationRepository.save(conversation);
  }

  async flag(
    userId: string,
    id: string,
    dto: FlagConversationDto,
  ): Promise<AiConversation> {
    const conversation = await this.getConversation(userId, id);
    conversation.isFlagged = true;
    conversation.flagReason = dto.reason ?? 'Flagged by user';
    conversation.status = AIConversationStatus.FLAGGED;
    return this.conversationRepository.save(conversation);
  }

  // ─── PRIVATE HELPERS ────────────────────────────────────────────────────────

  private async getOrCreateConversation(
    userId: string,
    dto: SendMessageDto,
  ): Promise<AiConversation> {
    if (dto.conversationId) {
      const existing = await this.conversationRepository.findOne({
        where: { id: dto.conversationId },
      });
      if (!existing) throw new NotFoundException('Conversation not found.');
      if (existing.userId !== userId)
        throw new ForbiddenException('Not your conversation.');
      return existing;
    }

    const conversation = this.conversationRepository.create({
      userId,
      feature: AIFeature.SABI_TUTOR,
      title: dto.message.slice(0, 60),
      subject: dto.subject ?? null,
      status: AIConversationStatus.ACTIVE,
      lastActivityAt: new Date(),
    });
    return this.conversationRepository.save(conversation);
  }

  private async buildSystemPrompt(
    conversation: AiConversation,
    dto: SendMessageDto,
  ): Promise<string> {
    const base = await this.promptService.getActivePrompt(AIFeature.SABI_TUTOR);
    const parts = [base];

    if (dto.subject ?? conversation.subject)
      parts.push(`Subject focus: ${dto.subject ?? conversation.subject}.`);
    if (dto.difficulty) parts.push(`Target level: ${dto.difficulty}.`);
    if (dto.style) parts.push(this.styleInstruction(dto.style));
    if (dto.pidgin) {
      parts.push(
        'The student has enabled Nigerian Pidgin mode — respond in a warm mix of English and Pidgin, the way a friendly Nigerian tutor would explain things, while keeping technical terms accurate.',
      );
    }

    return parts.join(' ');
  }

  private styleInstruction(style: string): string {
    switch (style) {
      case 'concise':
        return 'Keep responses short and to the point.';
      case 'examples':
        return 'Lead with a concrete example before explaining the underlying concept.';
      case 'socratic':
        return 'Favor guiding questions over direct answers where appropriate, helping the student reason their way to the answer.';
      default:
        return 'Give thorough, well-structured explanations.';
    }
  }

  private async loadHistory(conversationId: string): Promise<AiChatMessage[]> {
    const messages = await this.messageRepository.find({
      where: { conversation: { id: conversationId } },
      order: { createdAt: 'DESC' },
      take: HISTORY_WINDOW,
    });
    return messages
      .reverse()
      .filter((m) => m.role !== AIMessageRole.SYSTEM)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
  }

  private async saveMessage(
    conversation: AiConversation,
    role: AIMessageRole,
    content: string,
    result?: {
      tokensInput: number;
      tokensOutput: number;
      responseTimeMs: number;
      modelId: string;
      costUsd: number;
    },
  ): Promise<AiMessage> {
    const message = this.messageRepository.create({
      conversation,
      role,
      content,
      tokensInput: result?.tokensInput ?? 0,
      tokensOutput: result?.tokensOutput ?? 0,
      costUsd: result?.costUsd ?? 0,
      responseTimeMs: result?.responseTimeMs ?? null,
      modelId: result?.modelId ?? null,
    });
    return this.messageRepository.save(message);
  }

  private async touchConversation(
    conversation: AiConversation,
    modelId: string,
    tokensDelta: number,
    costDelta: number,
  ): Promise<void> {
    conversation.messageCount += 2; // user + assistant
    conversation.totalTokens += tokensDelta;
    conversation.totalCostUsd = Number(conversation.totalCostUsd) + costDelta;
    conversation.lastModelId = modelId;
    conversation.lastActivityAt = new Date();
    await this.conversationRepository.save(conversation);
  }
}
