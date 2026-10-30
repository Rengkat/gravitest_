import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AiTutorService } from './ai-tutor.service';
import { SendMessageDto } from './dto/send-message.dto';
import {
  RateConversationDto,
  FlagConversationDto,
  RenameConversationDto,
} from './dto/conversation-feedback.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserId } from 'src/auth/decorators/current-user.decorator';

@ApiTags('AI Tutor')
@UseGuards(JwtAuthGuard)
@Controller('ai/tutor')
export class AiTutorController {
  private readonly logger = new Logger(AiTutorController.name);

  constructor(private readonly tutorService: AiTutorService) {}

  // POST /ai/tutor/messages — full response in one shot (non-streaming clients)
  @Post('messages')
  @ApiOperation({ summary: 'Send a chat message to Sabi Tutor (non-streaming)' })
  @ApiResponse({ status: 201, description: 'Assistant reply' })
  sendMessage(@UserId() userId: string, @Body() dto: SendMessageDto) {
    return this.tutorService.sendMessage(userId, dto);
  }

  // POST /ai/tutor/messages/stream — Server-Sent Events, one `data:` line
  // per chunk, matching your useChat.ts's streaming assistant bubble.
  // Each event is JSON: { delta, done, conversationId, modelId?, costUsd? }
  @Post('messages/stream')
  @ApiOperation({ summary: 'Send a chat message to Sabi Tutor (SSE streaming)' })
  async streamMessage(
    @UserId() userId: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      for await (const chunk of this.tutorService.streamMessage(userId, dto)) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    } catch (err) {
      // The 200 + SSE headers are already on the wire, so a failure can only be
      // reported IN the stream. Keep the HTTP status and the structured body of
      // a deliberate error (e.g. the paywall's UPGRADE_REQUIRED / QUOTA_EXHAUSTED
      // 403) so the client can rebuild it and show the right prompt. Anything
      // that is NOT a deliberate HttpException is an internal failure: log the
      // real cause here and send the student a generic line — never raw provider
      // or stack text.
      if (err instanceof HttpException) {
        const body = err.getResponse();
        res.write(
          `data: ${JSON.stringify({
            delta: '',
            done: true,
            error: err.message,
            errorStatus: err.getStatus(),
            ...(body && typeof body === 'object' ? { errorBody: body } : {}),
          })}\n\n`,
        );
      } else {
        this.logger.error(`Tutor stream failed: ${(err as Error)?.message ?? err}`);
        res.write(
          `data: ${JSON.stringify({
            delta: '',
            done: true,
            error: 'AI service is temporarily unavailable.',
            errorStatus: 500,
          })}\n\n`,
        );
      }
    } finally {
      res.end();
    }
  }

  @Get('conversations')
  @ApiOperation({ summary: "List the current user's tutor conversations" })
  @ApiResponse({ status: 200, description: 'Conversations retrieved' })
  listConversations(@UserId() userId: string) {
    return this.tutorService.listConversations(userId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a conversation with its full message history' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Conversation retrieved' })
  getConversation(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.tutorService.getConversation(userId, id);
  }

  @Patch('conversations/:id')
  @ApiOperation({ summary: 'Rename a conversation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Conversation renamed' })
  renameConversation(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RenameConversationDto,
  ) {
    return this.tutorService.renameConversation(userId, id, dto.title);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Conversation deleted' })
  deleteConversation(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.tutorService.deleteConversation(userId, id);
  }

  @Post('conversations/:id/rate')
  @ApiOperation({ summary: 'Rate a conversation (1-5 stars + optional feedback)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Rating saved' })
  rate(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RateConversationDto) {
    return this.tutorService.rate(userId, id, dto);
  }

  @Post('conversations/:id/flag')
  @ApiOperation({ summary: 'Flag a conversation for admin review (e.g. inappropriate response)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Conversation flagged' })
  flag(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: FlagConversationDto) {
    return this.tutorService.flag(userId, id, dto);
  }
}
