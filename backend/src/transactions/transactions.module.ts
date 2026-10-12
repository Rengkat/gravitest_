import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { Transaction } from './entities/transaction.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { BillingController } from './billing.controller';
import { PaystackWebhookController } from './paystack-webhook.controller';
import { OpayWebhookController } from './opay-webhook.controller';
import { PaymentsModule } from 'src/payments/payments.module';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import paystackConfig from 'src/config/paystackConfig';
import { AdminAlertsModule } from 'src/admin-alerts/admin-alerts.module';
import { StudentsModule } from 'src/students/students.module';
import { AiUsageLog } from 'src/ai/entities/ai-usage-log.entity';
import { MailModule } from 'src/mail/mail.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, PaymentMethod, AiUsageLog]),
    ConfigModule.forFeature(paystackConfig),
    HttpModule.register({ timeout: 15000 }),
    PaginationModule,
    AdminAlertsModule,
    StudentsModule,
    MailModule,
    UserModule,
    PaymentsModule,
  ],
  controllers: [
    TransactionsController,
    BillingController,
    PaystackWebhookController,
    OpayWebhookController,
  ],
  providers: [TransactionsService],
  // Exported so SubscriptionsModule (and any future paid module) can
  // inject TransactionsService without re-declaring the Paystack wiring.
  exports: [TransactionsService],
})
export class TransactionsModule {}
