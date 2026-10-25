import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AiExplainService } from './ai-explain.service';
import { ExplainQuestionDto } from './dto/explain-question.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserId } from 'src/auth/decorators/current-user.decorator';

@ApiTags('AI Explain')
@UseGuards(JwtAuthGuard)
@Controller('ai/explain')
export class AiExplainController {
  constructor(private readonly explainService: AiExplainService) {}

  @Post('mcq')
  @ApiOperation({
    summary: 'Get an AI explanation for an MCQ question (cached per question)',
  })
  @ApiResponse({
    status: 201,
    description: 'Explanation generated or served from cache',
  })
  explain(@UserId() userId: string, @Body() dto: ExplainQuestionDto) {
    return this.explainService.explain(userId, dto);
  }
}
