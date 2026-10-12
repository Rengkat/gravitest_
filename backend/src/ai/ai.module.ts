import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiEssayScore } from './entities/ai-essay-score.entity';
import { AiExplanationCache } from './entities/ai-explanation-cache.entity';
import { AiFeatureModelMapping } from './entities/ai-feature-model-mapping.entity';
import { AiMessage } from './entities/ai-message.entity';
import { AiModelConfig } from './entities/ai-model-config.entity';
import { AiRateLimitConfig } from './entities/ai-rate-limit-config.entity';
import { AiRubric } from './entities/ai-rubric.entity';
import { AiSystemPrompt } from './entities/ai-system-prompt.entity';
import { AiUsageLog } from './entities/ai-usage-log.entity';
import { AiSettings } from './entities/ai-settings.entity';
import { AiProviderFactory } from './providers/ai-provider.factory';
import { AiRouterService } from './ai-router.service';
import { AiPromptService } from './ai-prompt.service';
import { AiRateLimitService } from './ai-rate-limit.service';
import { AiTutorService } from './ai-tutor.service';
import { AiScoringService } from './ai-scoring.service';
import { AiExplainService } from './ai-explain.service';
import { AiAdminService } from './ai-admin.service';
import { AiSettingsService } from './ai-settings.service';
import { AiSeedService } from './ai-seed.service';
import { AiAdminController } from './ai-admin.controller';
import { AiExplainController } from './ai-explain.controller';
import { AiScoringController } from './ai-scoring.controller';
import { AiTutorController } from './ai-tutor.controller';
import { ConfigModule } from '@nestjs/config';
import aiConfig from 'src/config/aiConfig';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { EntitlementsModule } from 'src/entitlements/entitlements.module';
import { QuestionsModule } from 'src/questions/questions.module';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { AdminAlertsModule } from 'src/admin-alerts/admin-alerts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiConversation,
      AiEssayScore,
      AiExplanationCache,
      AiFeatureModelMapping,
      AiMessage,
      AiModelConfig,
      AiRateLimitConfig,
      AiRubric,
      AiSystemPrompt,
      AiUsageLog,
      AiSettings,
    ]),
    SubscriptionsModule,
    EntitlementsModule,
    QuestionsModule,
    PaginationModule,
    NotificationsModule,
    AdminAlertsModule,
  ],
  controllers: [
    AiAdminController,
    AiExplainController,
    AiScoringController,
    AiTutorController,
  ],
  providers: [
    AiProviderFactory,
    AiRouterService,
    AiPromptService,
    AiRateLimitService,
    AiTutorService,
    AiScoringService,
    AiExplainService,
    AiAdminService,
    AiSettingsService,
    AiSeedService,
  ],
  exports: [
    AiScoringService,
    AiExplainService,
    AiTutorService,
    AiRouterService,
    AiRateLimitService,
    AiSettingsService,
  ],
})
export class AiModule {}
