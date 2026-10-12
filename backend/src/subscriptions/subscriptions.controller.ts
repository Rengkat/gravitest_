import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { SubscriptionsService } from './subscriptions.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { SubscriptionFiltersDto } from './dto/subscription-filters.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserId } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { UserRole } from 'src/common/enums/enums';

@ApiTags('Subscriptions')
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ─── PLAN CATALOG ──────────────────────────────────────────────────────────

  // Public on purpose: the marketing /pricing page is viewed by logged-out
  // visitors. Read-only, and only active+listed plans are ever returned.
  @Public()
  @Get('plans')
  @ApiOperation({
    summary: 'List available plans (for the plan comparison UI)',
  })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully' })
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  // ─── STUDENT-FACING ─────────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({
    summary: "Get the current user's active subscription, if any",
  })
  @ApiResponse({ status: 200, description: 'Current subscription retrieved' })
  getMySubscription(@UserId() userId: string) {
    return this.subscriptionsService.getCurrentSubscription(userId);
  }

  @Get('me/history')
  @ApiOperation({ summary: "Get the current user's full subscription history" })
  @ApiResponse({ status: 200, description: 'Subscription history retrieved' })
  getMyHistory(@UserId() userId: string) {
    return this.subscriptionsService.getSubscriptionHistory(userId);
  }

  @Get('me/usage')
  @ApiOperation({ summary: "Get the current user's usage for their current billing period" })
  @ApiResponse({ status: 200, description: 'Usage summary retrieved' })
  getMyUsage(@UserId() userId: string) {
    return this.subscriptionsService.getUsageSummary(userId);
  }

  // Body: { tier, interval?, paymentMethodId? }
  // Returns either { authorizationUrl, subscription } to redirect to
  // Paystack, or just { subscription } already active if paymentMethodId
  // was supplied (or tier is FREE).
  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to (or upgrade/downgrade to) a plan' })
  @ApiResponse({ status: 201, description: 'Subscription initiated' })
  subscribe(@UserId() userId: string, @Body() dto: SubscribeDto) {
    return this.subscriptionsService.subscribe(userId, dto);
  }

  // Body: { reason? }
  @Patch('cancel')
  @ApiOperation({
    summary:
      'Cancel the current subscription (access continues until period end)',
  })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  cancel(@UserId() userId: string, @Body('reason') reason?: string) {
    return this.subscriptionsService.cancelSubscription(userId, reason);
  }

  // ─── ADMIN ──────────────────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'List all subscriptions (platform-wide)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'tier', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({
    status: 200,
    description: 'Subscriptions retrieved successfully',
  })
  findAll(@Query() filters: SubscriptionFiltersDto) {
    return this.subscriptionsService.findAllForAdmin(filters);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Subscription stats (active/cancelled/expired counts, estimated MRR)',
  })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  getStats() {
    return this.subscriptionsService.getStats();
  }
}
