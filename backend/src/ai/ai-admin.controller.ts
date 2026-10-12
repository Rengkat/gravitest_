import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AiAdminService } from './ai-admin.service';
import { AiPromptService } from './ai-prompt.service';
import { AiRateLimitService } from './ai-rate-limit.service';
import { AiSettingsService } from './ai-settings.service';
import {
  CreateModelConfigDto,
  UpdateModelConfigDto,
  UpdateFeatureMappingDto,
  CreateSystemPromptDto,
  UpdateRateLimitDto,
  AdminConversationFiltersDto,
  CreateRubricDto,
  UpdateRubricDto,
  UpdateAiSettingsDto,
} from './dto/admin.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserId } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AIFeature, SubscriptionTier, UserRole } from 'src/common/enums/enums';

@ApiTags('AI Admin')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('ai/admin')
export class AiAdminController {
  constructor(
    private readonly adminService: AiAdminService,
    private readonly promptService: AiPromptService,
    private readonly rateLimitService: AiRateLimitService,
    private readonly settingsService: AiSettingsService,
  ) {}

  // ─── GLOBAL AI SETTINGS (matches the AI Settings page) ─────────────────
  // Only autoFlagThreshold, notifyOnFlagged, budget alerting, notifyEmail,
  // and retentionDays live here — default model/temperature are per-feature
  // via feature-mappings above, not duplicated here. See the comment on
  // the AiSettings entity for why.

  @Get('settings')
  @ApiOperation({ summary: 'Get global AI settings (auto-flag threshold, budget alerts, retention)' })
  @ApiResponse({ status: 200, description: 'Settings retrieved' })
  getSettings() {
    return this.settingsService.get();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update global AI settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  updateSettings(@Body() dto: UpdateAiSettingsDto) {
    return this.settingsService.update(dto);
  }

  // ─── MODEL REGISTRY (matches AIModelSelector.tsx) ──────────────────────────

  @Get('models')
  @ApiOperation({ summary: 'List all registered AI models' })
  @ApiResponse({ status: 200, description: 'Models retrieved' })
  listModels() {
    return this.adminService.listModels();
  }

  @Post('models')
  @ApiOperation({ summary: 'Register a new AI model' })
  @ApiResponse({ status: 201, description: 'Model created' })
  createModel(@Body() dto: CreateModelConfigDto) {
    return this.adminService.createModel(dto);
  }

  @Patch('models/:id')
  @ApiOperation({ summary: 'Update a model (e.g. toggle isActive, adjust pricing)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Model updated' })
  updateModel(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateModelConfigDto) {
    return this.adminService.updateModel(id, dto);
  }

  @Delete('models/:id')
  @ApiOperation({ summary: 'Delete a model (blocked if assigned to a feature)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Model deleted' })
  deleteModel(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteModel(id);
  }

  // ─── FEATURE → MODEL MAPPINGS (matches AIConfigPanel.tsx) ──────────────────

  @Get('feature-mappings')
  @ApiOperation({ summary: 'List which model handles which AI feature' })
  @ApiResponse({ status: 200, description: 'Mappings retrieved' })
  listMappings() {
    return this.adminService.listMappings();
  }

  @Patch('feature-mappings/:feature')
  @ApiOperation({ summary: 'Assign primary/fallback models to a feature — takes effect immediately, no redeploy' })
  @ApiParam({ name: 'feature', enum: AIFeature })
  @ApiResponse({ status: 200, description: 'Mapping updated' })
  upsertMapping(@Param('feature') feature: AIFeature, @Body() dto: UpdateFeatureMappingDto) {
    return this.adminService.upsertMapping(feature, dto);
  }

  // ─── SYSTEM PROMPTS (matches SystemPromptEditor.tsx) ───────────────────────

  @Get('prompts/:feature')
  @ApiOperation({ summary: 'List prompt version history for a feature' })
  @ApiParam({ name: 'feature', enum: AIFeature })
  @ApiResponse({ status: 200, description: 'Prompts retrieved' })
  listPrompts(@Param('feature') feature: AIFeature) {
    return this.promptService.listForFeature(feature);
  }

  @Post('prompts')
  @ApiOperation({ summary: 'Create a new prompt version for a feature (auto-activates unless activate=false)' })
  @ApiResponse({ status: 201, description: 'Prompt created' })
  createPrompt(@UserId() adminId: string, @Body() dto: CreateSystemPromptDto) {
    return this.promptService.create({ ...dto, createdBy: adminId });
  }

  @Patch('prompts/:id/activate')
  @ApiOperation({ summary: 'Roll back to (or switch to) a specific prompt version' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Prompt activated' })
  activatePrompt(@Param('id', ParseUUIDPipe) id: string) {
    return this.promptService.activate(id);
  }

  // ─── RATE LIMITS (matches RateLimitControls.tsx, keyed to real tiers) ──────

  @Get('rate-limits')
  @ApiOperation({ summary: 'List AI rate limits per subscription tier' })
  @ApiResponse({ status: 200, description: 'Rate limits retrieved' })
  listRateLimits() {
    return this.rateLimitService.listAll();
  }

  @Patch('rate-limits/:tier')
  @ApiOperation({ summary: 'Update AI rate limits for a subscription tier' })
  @ApiParam({ name: 'tier', enum: SubscriptionTier })
  @ApiResponse({ status: 200, description: 'Rate limits updated' })
  updateRateLimits(@Param('tier') tier: SubscriptionTier, @Body() dto: UpdateRateLimitDto) {
    return this.rateLimitService.update(tier, dto);
  }

  // ─── CONVERSATIONS (matches ConversationList/ConversationDetail/FlaggedConversations) ──

  @Get('conversations')
  @ApiOperation({ summary: 'List all conversations platform-wide, filterable by feature/flagged/search' })
  @ApiQuery({ name: 'feature', required: false })
  @ApiQuery({ name: 'flagged', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Conversations retrieved' })
  listConversations(@Query() filters: AdminConversationFiltersDto) {
    return this.adminService.listConversations(filters);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a conversation with full message history (admin view)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Conversation retrieved' })
  getConversation(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getConversation(id);
  }

  @Patch('conversations/:id/unflag')
  @ApiOperation({ summary: 'Clear a flag after review' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Conversation unflagged' })
  unflag(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.unflag(id);
  }

  // ─── ANALYTICS (matches AICostStats / AIPerformanceStats) ──────────────────

  @Get('analytics/cost')
  @ApiOperation({ summary: 'Cost breakdown by feature, model, and top users' })
  @ApiResponse({ status: 200, description: 'Cost stats retrieved' })
  costStats() {
    return this.adminService.getCostStats();
  }

  @Get('analytics/performance')
  @ApiOperation({ summary: 'Success rate, avg latency, fallback rate, errors by model' })
  @ApiResponse({ status: 200, description: 'Performance stats retrieved' })
  performanceStats() {
    return this.adminService.getPerformanceStats();
  }

  // ─── RUBRICS (matches RubricManager.tsx) ───────────────────────────────────

  @Get('rubrics')
  @ApiOperation({ summary: 'List scoring rubrics' })
  @ApiResponse({ status: 200, description: 'Rubrics retrieved' })
  listRubrics() {
    return this.adminService.listRubrics();
  }

  @Post('rubrics')
  @ApiOperation({ summary: 'Create a scoring rubric' })
  @ApiResponse({ status: 201, description: 'Rubric created' })
  createRubric(@Body() dto: CreateRubricDto) {
    return this.adminService.createRubric(dto);
  }

  @Patch('rubrics/:id')
  @ApiOperation({ summary: 'Update a scoring rubric' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Rubric updated' })
  updateRubric(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRubricDto) {
    return this.adminService.updateRubric(id, dto);
  }

  @Delete('rubrics/:id')
  @ApiOperation({ summary: 'Delete a scoring rubric' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Rubric deleted' })
  deleteRubric(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteRubric(id);
  }
}
