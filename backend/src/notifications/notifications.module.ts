import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { BroadcastCampaignService } from './broadcast-campaign.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserNotificationPreferences } from './entities/user-notification-preferences.entity';
import { Notification } from './entities/notification.entity';
import { AdminBroadcast } from './entities/admin-broadcast.entity';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { UserModule } from 'src/user/user.module';
import { MailModule } from 'src/mail/mail.module';
import { NotificationEventsEmitter } from './providers/notification-events.emitter';
import { BroadcastSchedulerProvider } from './providers/broadcast-scheduler.provider';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    BroadcastCampaignService,
    NotificationEventsEmitter,
    BroadcastSchedulerProvider,
  ],
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      UserNotificationPreferences,
      AdminBroadcast,
    ]),
    UserModule,
    PaginationModule,
    MailModule,
    // ScheduleModule.forRoot() now lives in AppModule (root) — see the
    // comment there. Cron providers in this module (BroadcastSchedulerProvider)
    // are still discovered correctly since @nestjs/schedule's discovery
    // scans the whole app, not just the module that called forRoot().
  ],
  exports: [NotificationsService, BroadcastCampaignService],
})
export class NotificationsModule {}
