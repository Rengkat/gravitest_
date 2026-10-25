import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AiModelConfig } from './entities/ai-model-config.entity';
import { AiFeatureModelMapping } from './entities/ai-feature-model-mapping.entity';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiUsageLog } from './entities/ai-usage-log.entity';
import { AiRubric } from './entities/ai-rubric.entity';
import {
  CreateModelConfigDto,
  UpdateModelConfigDto,
  UpdateFeatureMappingDto,
  AdminConversationFiltersDto,
  CreateRubricDto,
  UpdateRubricDto,
} from './dto/admin.dto';
import { AIFeature } from 'src/common/enums/enums';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { PaginatedResult } from 'src/common/pagination/pagination.interface';

@Injectable()
export class AiAdminService {
  constructor(
    @InjectRepository(AiModelConfig)
    private readonly modelConfigRepository: Repository<AiModelConfig>,

    @InjectRepository(AiFeatureModelMapping)
    private readonly mappingRepository: Repository<AiFeatureModelMapping>,

    @InjectRepository(AiConversation)
    private readonly conversationRepository: Repository<AiConversation>,

    @InjectRepository(AiUsageLog)
    private readonly usageLogRepository: Repository<AiUsageLog>,

    @InjectRepository(AiRubric)
    private readonly rubricRepository: Repository<AiRubric>,

    private readonly paginationProvider: PaginationProvider,
  ) {}

  // ─── MODEL REGISTRY ─────────────────────────────────────────────────────────

  async listModels(): Promise<AiModelConfig[]> {
    return this.modelConfigRepository.find({ order: { name: 'ASC' } });
  }

  async createModel(dto: CreateModelConfigDto): Promise<AiModelConfig> {
    const model = this.modelConfigRepository.create(dto);
    return this.modelConfigRepository.save(model);
  }

  async updateModel(
    id: string,
    dto: UpdateModelConfigDto,
  ): Promise<AiModelConfig> {
    const model = await this.modelConfigRepository.findOne({ where: { id } });
    if (!model) throw new NotFoundException(`Model "${id}" not found.`);
    await this.modelConfigRepository.update(id, dto);
    return this.modelConfigRepository.findOne({
      where: { id },
    }) as Promise<AiModelConfig>;
  }

  async deleteModel(id: string): Promise<{ id: string }> {
    const model = await this.modelConfigRepository.findOne({ where: { id } });
    if (!model) throw new NotFoundException(`Model "${id}" not found.`);

    const inUse = await this.mappingRepository.findOne({
      where: [
        { primaryModelId: model.modelId },
        { fallbackModelId: model.modelId },
      ],
    });
    if (inUse) {
      throw new BadRequestException(
        `Model "${model.modelId}" is assigned to feature "${inUse.feature}" — reassign that feature first, or deactivate the model instead of deleting it.`,
      );
    }

    await this.modelConfigRepository.delete(id);
    return { id };
  }

  // ─── FEATURE → MODEL MAPPINGS ───────────────────────────────────────────────

  async listMappings(): Promise<AiFeatureModelMapping[]> {
    return this.mappingRepository.find();
  }

  async upsertMapping(
    feature: AIFeature,
    dto: UpdateFeatureMappingDto,
  ): Promise<AiFeatureModelMapping> {
    const primaryExists = await this.modelConfigRepository.findOne({
      where: { modelId: dto.primaryModelId },
    });
    if (!primaryExists)
      throw new BadRequestException(
        `No model registered with modelId "${dto.primaryModelId}".`,
      );

    if (dto.fallbackModelId) {
      const fallbackExists = await this.modelConfigRepository.findOne({
        where: { modelId: dto.fallbackModelId },
      });
      if (!fallbackExists)
        throw new BadRequestException(
          `No model registered with modelId "${dto.fallbackModelId}".`,
        );
    }

    let mapping = await this.mappingRepository.findOne({ where: { feature } });
    if (!mapping) {
      mapping = this.mappingRepository.create({ feature, ...dto });
    } else {
      Object.assign(mapping, dto);
    }
    return this.mappingRepository.save(mapping);
  }

  // ─── CONVERSATIONS (moderation) ─────────────────────────────────────────────

  async listConversations(
    filters: AdminConversationFiltersDto,
  ): Promise<PaginatedResult<AiConversation>> {
    const {
      page = 1,
      limit = 50,
      feature,
      flagged,
      search,
      sortBy = 'lastActivityAt',
      sortOrder = 'DESC',
    } = filters;

    const qb = this.conversationRepository.createQueryBuilder('c');
    if (feature) qb.andWhere('c.feature = :feature', { feature });
    if (flagged !== undefined)
      qb.andWhere('c.isFlagged = :flagged', { flagged });
    if (search) {
      qb.andWhere('(c.userId::text ILIKE :search OR c.title ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const allowedSorts: Record<string, string> = {
      createdAt: 'c.createdAt',
      lastActivityAt: 'c.lastActivityAt',
      totalCostUsd: 'c.totalCostUsd',
    };
    qb.orderBy(allowedSorts[sortBy] ?? 'c.lastActivityAt', sortOrder);

    return this.paginationProvider.paginateQueryBuilder(qb, { page, limit });
  }

  async getConversation(id: string): Promise<AiConversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['messages'],
    });
    if (!conversation) throw new NotFoundException('Conversation not found.');
    return conversation;
  }

  async unflag(id: string): Promise<AiConversation> {
    const conversation = await this.getConversation(id);
    conversation.isFlagged = false;
    conversation.flagReason = null;
    return this.conversationRepository.save(conversation);
  }

  // ─── COST / PERFORMANCE ANALYTICS ───────────────────────────────────────────

  async getCostStats(): Promise<{
    totalCostUsd: number;
    costToday: number;
    costByFeature: Record<string, number>;
    costByModel: Record<string, number>;
    topUsersByCost: { userId: string; costUsd: number }[];
  }> {
    const base = this.usageLogRepository
      .createQueryBuilder('l')
      .where('l.success = true');
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalRaw, todayRaw, byFeatureRaw, byModelRaw, topUsersRaw] =
      await Promise.all([
        base
          .clone()
          .select('COALESCE(SUM(l.costUsd), 0)', 'sum')
          .getRawOne<{ sum: string }>(),
        base
          .clone()
          .select('COALESCE(SUM(l.costUsd), 0)', 'sum')
          .andWhere('l.createdAt >= :start', { start: startOfToday })
          .getRawOne<{ sum: string }>(),
        base
          .clone()
          .select('l.feature', 'feature')
          .addSelect('SUM(l.costUsd)', 'sum')
          .groupBy('l.feature')
          .getRawMany<{ feature: string; sum: string }>(),
        base
          .clone()
          .select('l.modelId', 'modelId')
          .addSelect('SUM(l.costUsd)', 'sum')
          .groupBy('l.modelId')
          .getRawMany<{ modelId: string; sum: string }>(),
        base
          .clone()
          .select('l.userId', 'userId')
          .addSelect('SUM(l.costUsd)', 'sum')
          .groupBy('l.userId')
          .orderBy('sum', 'DESC')
          .limit(10)
          .getRawMany<{ userId: string; sum: string }>(),
      ]);

    return {
      totalCostUsd: Number(totalRaw?.sum ?? 0),
      costToday: Number(todayRaw?.sum ?? 0),
      costByFeature: Object.fromEntries(
        byFeatureRaw.map((r) => [r.feature, Number(r.sum)]),
      ),
      costByModel: Object.fromEntries(
        byModelRaw.map((r) => [r.modelId, Number(r.sum)]),
      ),
      topUsersByCost: topUsersRaw.map((r) => ({
        userId: r.userId,
        costUsd: Number(r.sum),
      })),
    };
  }

  async getPerformanceStats(): Promise<{
    totalRequests: number;
    successRate: number;
    avgResponseTimeMs: number;
    fallbackRate: number;
    errorsByModel: Record<string, number>;
  }> {
    const total = await this.usageLogRepository.count();
    if (total === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        avgResponseTimeMs: 0,
        fallbackRate: 0,
        errorsByModel: {},
      };
    }

    const [successCount, fallbackCount, avgRaw, errorsRaw] = await Promise.all([
      this.usageLogRepository.count({ where: { success: true } }),
      this.usageLogRepository.count({ where: { usedFallback: true } }),
      this.usageLogRepository
        .createQueryBuilder('l')
        .select('AVG(l.responseTimeMs)', 'avg')
        .where('l.success = true')
        .getRawOne<{ avg: string }>(),
      this.usageLogRepository
        .createQueryBuilder('l')
        .select('l.modelId', 'modelId')
        .addSelect('COUNT(*)', 'count')
        .where('l.success = false')
        .groupBy('l.modelId')
        .getRawMany<{ modelId: string; count: string }>(),
    ]);

    return {
      totalRequests: total,
      successRate: successCount / total,
      avgResponseTimeMs: Math.round(Number(avgRaw?.avg ?? 0)),
      fallbackRate: fallbackCount / total,
      errorsByModel: Object.fromEntries(
        errorsRaw.map((r) => [r.modelId, Number(r.count)]),
      ),
    };
  }

  // ─── RUBRICS ────────────────────────────────────────────────────────────────

  async listRubrics(): Promise<AiRubric[]> {
    return this.rubricRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async createRubric(dto: CreateRubricDto): Promise<AiRubric> {
    return this.rubricRepository.save(this.rubricRepository.create(dto));
  }

  async updateRubric(id: string, dto: UpdateRubricDto): Promise<AiRubric> {
    const rubric = await this.rubricRepository.findOne({ where: { id } });
    if (!rubric) throw new NotFoundException(`Rubric "${id}" not found.`);
    await this.rubricRepository.update(id, dto);
    return this.rubricRepository.findOne({
      where: { id },
    }) as Promise<AiRubric>;
  }

  async deleteRubric(id: string): Promise<{ id: string }> {
    await this.rubricRepository.delete(id);
    return { id };
  }
}
