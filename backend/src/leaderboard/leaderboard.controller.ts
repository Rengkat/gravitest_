import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { LeaderboardService } from './leaderboard.service';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserId } from 'src/auth/decorators/current-user.decorator';

// Student-facing leaderboard (spec §1.8): general / category / exam-type /
// monthly views, the caller's own position, and their history. Admin
// management lives in AdminLeaderboardController (/admin/leaderboard).
@ApiTags('Leaderboard')
@UseGuards(JwtAuthGuard)
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  // GET /leaderboard?scope=general|category|exam_type&category=&examType=&period=current|YYYY-MM
  @Get()
  @ApiOperation({
    summary: 'Get a leaderboard (general, category, exam-type, or a specific month)',
  })
  getLeaderboard(@Query() query: LeaderboardQueryDto, @UserId() userId: string) {
    // Only admins may look at ineligible entries (see AdminLeaderboardController).
    return this.leaderboardService.getLeaderboard({ ...query, includeIneligible: false }, userId);
  }

  // GET /leaderboard/me?period=current|YYYY-MM
  @Get('me')
  @ApiOperation({
    summary: "Get the current user's rank/score across general, category and exam-type scopes",
  })
  getMyPosition(@UserId() userId: string, @Query('period') period?: string) {
    return this.leaderboardService.getMyPosition(userId, period);
  }

  // GET /leaderboard/history — list of past (and current) periods
  @Get('history')
  @ApiOperation({ summary: 'List leaderboard periods (for the history picker)' })
  getHistory() {
    return this.leaderboardService.getHistoryPeriods();
  }

  // GET /leaderboard/history/:period?scope=&category=&examType=
  @Get('history/:period')
  @ApiOperation({ summary: "Get a specific past period's leaderboard, e.g. '2026-09'" })
  getHistoryPeriod(
    @Param('period') period: string,
    @Query() query: LeaderboardQueryDto,
    @UserId() userId: string,
  ) {
    return this.leaderboardService.getLeaderboard({ ...query, period, includeIneligible: false }, userId);
  }
}
