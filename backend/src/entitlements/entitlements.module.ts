import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAlertsModule } from 'src/admin-alerts/admin-alerts.module';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { FeatureAccessRule } from './entities/feature-access-rule.entity';
import { FeatureUsage } from './entities/feature-usage.entity';
import { EntitlementsService } from './entitlements.service';
import { EntitlementsController } from './entitlements.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([FeatureAccessRule, FeatureUsage]),
    SubscriptionsModule,
    AdminAlertsModule,
  ],
  controllers: [EntitlementsController],
  providers: [EntitlementsService],
  exports: [EntitlementsService],
})
export class EntitlementsModule {}
