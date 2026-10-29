import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserId } from 'src/auth/decorators/current-user.decorator';
import { ExamsService } from './exams.service';
import {
  StartExamSessionDto,
  SubmitAnswerDto,
  FlagQuestionDto,
  AvailableCountQueryDto,
  ScoreAnswerDto,
} from './dto/exam-session.dto';

@ApiTags('Exams (CBT)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get('available-count')
  @ApiOperation({
    summary: 'How many questions are available for a set of session filters',
    description:
      'Same filters (and same pool rules) as starting a session, so the number never disagrees with what a session gets. ' +
      'A theory/practical question counts once, regardless of how many nested parts it has.',
  })
  countAvailable(@Query() query: AvailableCountQueryDto) {
    return this.examsService.countAvailable(query);
  }

  @Post('sessions')
  @ApiOperation({
    summary: 'Start a new CBT session (MCQ or theory/essay, practice or mock)',
    description:
      'Free for every tier, including FREE, per the launch plan — this is the core product, not a paywalled feature. ' +
      'Returns the session plus a sanitized question set (no correct answers included).',
  })
  startSession(@UserId() userId: string, @Body() dto: StartExamSessionDto) {
    return this.examsService.startSession(userId, dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List my exam sessions (most recent first)' })
  listMySessions(@UserId() userId: string) {
    return this.examsService.listMySessions(userId);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Resume/view a session (in-progress or completed)' })
  @ApiParam({ name: 'id', type: String })
  getSession(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.getSession(userId, id);
  }

  @Post('sessions/:id/answers')
  @ApiOperation({
    summary: 'Submit/update an answer for one question in the session',
    description:
      'MCQ: pass selectedLabel, graded instantly. Theory/essay: pass essayText and/or essayImageUrls ' +
      '(diagram URLs from POST /storage/upload) — graded by AI in one batch at session completion, not per-answer.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Exam session ID' })
  submitAnswer(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.examsService.submitAnswer(userId, id, dto);
  }

  @Post('sessions/:id/flag')
  @ApiOperation({ summary: 'Toggle "flag for review" on a question' })
  @ApiParam({ name: 'id', type: String })
  flagQuestion(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FlagQuestionDto,
  ) {
    return this.examsService.flagQuestion(userId, id, dto);
  }

  @Post('sessions/:id/answers/:sessionQuestionId/score')
  @ApiOperation({
    summary: '[Practice mode only] Score one essay answer immediately',
    description:
      'Lets a student check an essay answer as they go, instead of waiting for full session completion. ' +
      'Blocked in mock/exam mode — those never reveal scores mid-session. Counts against the normal AI rate limit.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Exam session ID' })
  @ApiParam({ name: 'sessionQuestionId', type: String })
  scoreAnswerNow(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('sessionQuestionId', ParseUUIDPipe) sessionQuestionId: string,
    @Body() dto: ScoreAnswerDto,
  ) {
    return this.examsService.scoreAnswerNow(userId, id, sessionQuestionId, dto?.path);
  }

  @Post('sessions/:id/answers/:sessionQuestionId/regrade')
  @ApiOperation({
    summary: 'Retry grading an answer that could not be graded at submission',
    description:
      'Only for a SUBMITTED/timed-out session whose essay answer is still pending (the AI call failed). ' +
      'Grades just the missing/failed parts, then updates the session totals. Never overwrites a part that was already graded.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Exam session ID' })
  @ApiParam({ name: 'sessionQuestionId', type: String })
  regradeAnswer(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('sessionQuestionId', ParseUUIDPipe) sessionQuestionId: string,
  ) {
    return this.examsService.regradeAnswer(userId, id, sessionQuestionId);
  }

  @Post('sessions/:id/complete')
  @ApiOperation({
    summary: 'Submit the whole session for grading',
    description:
      'Auto-grades all MCQ answers instantly and batch-scores any pending essay/theory answers via AI ' +
      '(including diagrams, using vision routing). If AI scoring is unavailable (e.g. free-tier daily cap ' +
      'reached mid-exam), affected essay answers are left for manual review rather than failing the submission.',
  })
  @ApiParam({ name: 'id', type: String })
  completeSession(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.completeSession(userId, id);
  }

  @Get('sessions/:id/results')
  @ApiOperation({ summary: 'Full per-question results breakdown (only available after completion)' })
  @ApiParam({ name: 'id', type: String })
  getResults(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.getResults(userId, id);
  }
}
