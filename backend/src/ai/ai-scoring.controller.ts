import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AiScoringService } from './ai-scoring.service';
import { ScoreEssayDto } from './dto/score-essay.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserId } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/enums';

@ApiTags('AI Scoring')
@UseGuards(JwtAuthGuard)
@Controller('ai/scoring')
export class AiScoringController {
  constructor(private readonly scoringService: AiScoringService) {}

  @Post('essay')
  @ApiOperation({
    summary: 'Score an essay/theory answer (practice or exam mode)',
  })
  @ApiResponse({ status: 201, description: 'Score generated' })
  scoreEssay(@UserId() userId: string, @Body() dto: ScoreEssayDto) {
    return this.scoringService.scoreEssay(userId, dto);
  }

  @Post(':id/elaborate')
  @ApiOperation({
    summary: 'Get a deeper, more detailed breakdown of an existing essay score',
    description:
      "Quotes the student's own answer, explains criterion-by-criterion reasoning, and " +
      'suggests a concrete rewrite of the weakest section. Generated once and cached on ' +
      'the score row — calling this again just returns the cached version.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 201,
    description: 'Detailed feedback generated (or returned from cache)',
  })
  elaborate(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.scoringService.elaborate(userId, id);
  }

  @Get('needs-review')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List low-confidence AI scores awaiting teacher review',
  })
  @ApiResponse({ status: 200, description: 'Scores retrieved' })
  needsReview() {
    return this.scoringService.needsReview();
  }

  @Patch(':id/review')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Override an AI score with a teacher's reviewed score",
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Score reviewed' })
  review(
    @UserId() adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reviewedScore') reviewedScore: number,
    @Body('reviewNotes') reviewNotes?: string,
  ) {
    return this.scoringService.reviewScore(
      adminId,
      id,
      reviewedScore,
      reviewNotes,
    );
  }

  @Get('analytics')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Scoring analytics — distributions, review rate, AI/teacher discrepancy',
  })
  @ApiResponse({ status: 200, description: 'Analytics retrieved' })
  analytics() {
    return this.scoringService.getAnalytics();
  }

  @Get('practice/students/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '[Admin] Per-student subject breakdown + recent scores',
    description:
      'Backs the per-student insight detail page in Practice Scoring.',
  })
  @ApiParam({ name: 'id', type: String, description: "Student's User UUID" })
  @ApiResponse({ status: 200, description: 'Student insight retrieved' })
  getStudentInsight(@Param('id', ParseUUIDPipe) id: string) {
    return this.scoringService.getStudentInsight(id);
  }
}
