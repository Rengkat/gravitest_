import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { UserModule } from 'src/user/user.module';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { Subscription } from './entities/subscription.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAlertsModule } from 'src/admin-alerts/admin-alerts.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PlansModule } from 'src/plans/plans.module';
import { PaymentsModule } from 'src/payments/payments.module';

@Module({
  imports: [
    // UserModule already does TypeOrmModule.forFeature([..., Subscription, ...])
    // and re-exports TypeOrmModule, so importing it gives us both the
    // Subscription repository AND UserService — no need to re-register
    TypeOrmModule.forFeature([Subscription]),
    UserModule,
    TransactionsModule, // gives us TransactionsService for initialize/charge/native-subscription calls
    PaginationModule,
    AdminAlertsModule,
    NotificationsModule,
    PlansModule,
    PaymentsModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
