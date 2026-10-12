import { Module } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryAccess } from './entities/library-content-access.entity';
import { LibraryContent } from './entities/library-contnent.entity';
import { LibraryRating } from './entities/library-rating.entity';
import { ContentAuditLog } from './entities/content-audit-log.entity';
import { ContentAuditLogService } from './providers/content-audit-log.service';
import { LibraryPreviewService } from './providers/library-preview.service';
import { LibraryContentPreview } from './entities/library-content-preview.entity';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { StorageModule } from 'src/storage/storage.module';
import { UserModule } from 'src/user/user.module';
import { QueueModule } from 'src/queue/queue.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { MailModule } from 'src/mail/mail.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { EntitlementsModule } from 'src/entitlements/entitlements.module';

@Module({
  controllers: [LibraryController],
  providers: [LibraryService, ContentAuditLogService, LibraryPreviewService],
  imports: [
    TypeOrmModule.forFeature([LibraryAccess, LibraryContent, LibraryRating, ContentAuditLog, LibraryContentPreview]),
    PaginationModule,
    StorageModule,
    UserModule,
    QueueModule,
    NotificationsModule,
    MailModule,
    TransactionsModule, // needed for the content-purchase checkout flow (initializeTransaction)
    SubscriptionsModule,
    EntitlementsModule, // shared tier resolution + the library promo switch — see LibraryService.resolveUserTier
  ],
  exports: [LibraryService, TypeOrmModule],
})
export class LibraryModule {}
