import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { LeaderboardService } from './leaderboard.service';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import { UpdateLeaderboardSettingsDto } from './dto/update-leaderboard-settings.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserId } from 'src/auth/decorators/current-user.decorator';
import { UserRole } from 'src/common/enums/enums';

// Admin Dashboard leaderboard management (spec §1.7): configure the
// ranking formula/eligibility rules, browse every scope (including
// ineligible users, for support/debugging), see incentive-qualified
// users, and manually trigger a recalculation or finalization.
@ApiTags('Admin · Leaderboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin/leaderboard')
export class AdminLeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  // GET /admin/leaderboard/settings
  @Get('settings')
  @ApiOperation({ summary: 'Get current leaderboard scoring/eligibility settings' })
  getSettings() {
    return this.leaderboardService.getSettings();
  }

  // PATCH /admin/leaderboard/settings
  @Patch('settings')
  @ApiOperation({
    summary: 'Update leaderboard weights, eligibility thresholds, and notification rules',
  })
  updateSettings(@Body() dto: UpdateLeaderboardSettingsDto, @UserId() adminId: string) {
    return this.leaderboardService.updateSettings(dto, adminId);
  }

  // GET /admin/leaderboard?scope=&category=&examType=&period=&includeIneligible=
  @Get()
  @ApiOperation({ summary: 'Browse the leaderboard with full admin filters' })
  getLeaderboard(@Query() query: LeaderboardQueryDto) {
    return this.leaderboardService.getLeaderboard(query);
  }

  // GET /admin/leaderboard/history
  @Get('history')
  @ApiOperation({ summary: 'List all leaderboard periods, finalized or in progress' })
  getHistory() {
    return this.leaderboardService.getHistoryPeriods();
  }

  // GET /admin/leaderboard/incentive-eligible?period=current|YYYY-MM&category=
  @Get('incentive-eligible')
  @ApiOperation({ summary: 'List users who qualify for the monthly incentive' })
  getIncentiveEligible(
    @Query('period') period: string | undefined,
    @Query('category') category: UserRole | undefined,
  ) {
    const resolved = !period || period === 'current' ? this.leaderboardService.periodKey(new Date()) : period;
    return this.leaderboardService.getIncentiveEligible(resolved, category);
  }

  // POST /admin/leaderboard/recalculate — manual trigger (normally cron-driven)
  @Post('recalculate')
  @ApiOperation({ summary: 'Manually recalculate the current period leaderboard' })
  recalculate() {
    return this.leaderboardService.recalculateCurrentPeriod();
  }

  // POST /admin/leaderboard/finalize/:period — manual trigger (normally cron-driven)
  @Post('finalize/:period')
  @ApiOperation({ summary: "Manually finalize a period, e.g. '2026-09' (normally automatic at month end)" })
  finalize(@Param('period') period: string) {
    return this.leaderboardService.finalizeMonth(period);
  }
}
