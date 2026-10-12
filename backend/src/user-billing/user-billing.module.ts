import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { EntitlementsModule } from 'src/entitlements/entitlements.module';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { LibraryModule } from 'src/library/library.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { UserBillingController } from './user-billing.controller';
import { UserBillingService } from './user-billing.service';

// Its own module so it can depend on subscriptions AND library without making
// those two import each other (they would form a cycle).
@Module({
  imports: [TypeOrmModule.forFeature([User]), EntitlementsModule, SubscriptionsModule, LibraryModule, TransactionsModule],
  controllers: [UserBillingController],
  providers: [UserBillingService],
})
export class UserBillingModule {}
