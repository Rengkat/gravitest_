import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';

import { AdminBroadcast } from '../entities/admin-broadcast.entity';
import { BroadcastStatus } from '../../common/enums/enums';
import { BroadcastCampaignService } from '../broadcast-campaign.service';

// @nestjs/schedule is a real dependency and ScheduleModule.forRoot() is
// registered once, in AppModule (root) — see the comment there and in
// NotificationsModule's imports. This provider just needs to be listed
// in NotificationsModule's providers array for its @Cron method to run.
@Injectable()
export class BroadcastSchedulerProvider {
  private readonly logger = new Logger(BroadcastSchedulerProvider.name);
  private isRunning = false; // simple in-process guard against overlapping runs

  constructor(
    @InjectRepository(AdminBroadcast)
    private readonly broadcastRepo: Repository<AdminBroadcast>,
    private readonly campaignService: BroadcastCampaignService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processDueCampaigns(): Promise<void> {
    if (this.isRunning) return; // previous run still in flight, skip this tick
    this.isRunning = true;

    try {
      const due = await this.broadcastRepo.find({
        where: {
          status: BroadcastStatus.QUEUED,
          scheduledFor: LessThanOrEqual(new Date()),
        },
        take: 20, // process in small batches per tick, don't block the loop
      });

      if (!due.length) return;

      this.logger.log(`Executing ${due.length} due broadcast campaign(s).`);

      for (const campaign of due) {
        try {
          await this.campaignService.execute(campaign.id);
        } catch (err: any) {
          this.logger.error(
            `Campaign ${campaign.id} failed during scheduled execution: ${err.message}`,
          );
        }
      }
    } finally {
      this.isRunning = false;
    }
  }
}
