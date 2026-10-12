import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { AdminLeaderboardController } from './admin-leaderboard.controller';

import { LeaderboardSettings } from './entities/leaderboard-settings.entity';
import { LeaderboardEntry } from './entities/leaderboard-entry.entity';
import { StudentProfile } from 'src/students/entities/student-profile.entity';
import { StudyActivity } from 'src/students/entities/study-activity.entity';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';

import { PaginationModule } from 'src/common/pagination/pagination.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { RealtimeModule } from 'src/realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LeaderboardSettings,
      LeaderboardEntry,
      // Read-only access to these — StudentsModule and SubscriptionsModule
      // own the write paths for them.
      StudentProfile,
      StudyActivity,
      Subscription,
    ]),
    PaginationModule,
    NotificationsModule,
    RealtimeModule,
  ],
  controllers: [LeaderboardController, AdminLeaderboardController],
  providers: [LeaderboardService],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
