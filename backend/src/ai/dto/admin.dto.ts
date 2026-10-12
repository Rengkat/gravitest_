import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { AIFeature, AIProvider, SubscriptionTier } from 'src/common/enums/enums';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

// ── Model registry ──────────────────────────────────────────────────────

export class CreateModelConfigDto {
  @IsString()
  modelId!: string;

  @IsString()
  name!: string;

  @IsEnum(AIProvider)
  provider!: AIProvider;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  costInputPerMillion!: number;

  @IsNumber()
  @Min(0)
  costOutputPerMillion!: number;

  @IsOptional()
  @IsInt()
  avgLatencyMs?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateModelConfigDto extends PartialType(CreateModelConfigDto) {}

// ── Feature → model mapping ─────────────────────────────────────────────

export class UpdateFeatureMappingDto {
  @IsString()
  primaryModelId!: string;

  @IsOptional()
  @IsString()
  fallbackModelId?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsInt()
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  temperature?: number;
}

// ── System prompts ──────────────────────────────────────────────────────

export class CreateSystemPromptDto {
  @IsString()
  name!: string;

  @IsEnum(AIFeature)
  feature!: AIFeature;

  @IsString()
  prompt!: string;

  @IsOptional()
  @IsBoolean()
  activate?: boolean;
}

// ── Rate limits ──────────────────────────────────────────────────────────

export class UpdateRateLimitDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  requestsPerDay?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  requestsPerHour?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  tokensPerDay?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  concurrentSessions?: number;
}

// ── Conversations (admin list) ──────────────────────────────────────────

export class AdminConversationFiltersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(AIFeature)
  feature?: AIFeature;

  @IsOptional()
  @IsBoolean()
  flagged?: boolean;

  @IsOptional()
  @IsString()
  search?: string; // userId or title

  @IsOptional()
  @IsIn(['createdAt', 'lastActivityAt', 'totalCostUsd'])
  sortBy?: string = 'lastActivityAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

// ── Rubrics ──────────────────────────────────────────────────────────────

class RubricCriterionAdminDto {
  @IsString()
  criterion!: string;

  @IsInt()
  @Min(1)
  maxPoints!: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateRubricDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  examType?: string;

  @IsArray()
  criteria!: RubricCriterionAdminDto[];
}

export class UpdateRubricDto extends PartialType(CreateRubricDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── GLOBAL AI SETTINGS ──────────────────────────────────────────────────

export class UpdateAiSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  autoFlagThreshold?: number;

  @IsOptional()
  @IsBoolean()
  notifyOnFlagged?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyBudgetLimitUsd?: number | null;

  @IsOptional()
  @IsBoolean()
  notifyOnBudgetAlert?: boolean;

  @IsOptional()
  @IsString()
  notifyEmail?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  retentionDays?: number | null;
}
