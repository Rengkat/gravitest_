import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, MoreThan, Repository } from 'typeorm';
import { SessionStatus } from 'src/common/enums/enums';
import { ExamSession } from 'src/students/entities/exam-session.entity';
import { ExamsService } from './exams.service';

/**
 * Sessions submitted before marks-based scoring have no points recorded, and any theory/practical marks they
 * earned were ignored (a 2/6 essay scored the whole session 0%). This recalculates them once, in the
 * background, shortly after boot. Idempotent: a session that already has points is skipped.
 *
 * It corrects the stored session result (what the results page shows). Aggregates that were rolled up from the
 * old percentage at submission time (profile averages, leaderboards) are not rewritten here.
 */
@Injectable()
export class SessionScoreBackfillService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SessionScoreBackfillService.name);

  constructor(
    @InjectRepository(ExamSession) private readonly sessions: Repository<ExamSession>,
    private readonly exams: ExamsService,
  ) {}

  onApplicationBootstrap(): void {
    // Not awaited: a large history must never delay the API coming up.
    setImmediate(() => {
      this.run().catch((e: Error) => this.logger.error(`Session score backfill failed: ${e.message}`));
    });
  }

  async run(batchSize = 100): Promise<number> {
    let fixed = 0;
    let lastId = '00000000-0000-0000-0000-000000000000';
    for (;;) {
      const batch = await this.sessions.find({
        where: {
          scorePoints: IsNull(),
          status: In([SessionStatus.SUBMITTED, SessionStatus.TIMED_OUT]),
          id: MoreThan(lastId),
        },
        select: { id: true },
        order: { id: 'ASC' },
        take: batchSize,
      });
      if (!batch.length) break;
      for (const { id } of batch) {
        try {
          if (await this.exams.recomputeSessionScores(id)) fixed++;
        } catch (e) {
          this.logger.warn(`Could not recalculate session ${id}: ${(e as Error).message}`);
        }
      }
      lastId = batch[batch.length - 1].id;
    }
    if (fixed) this.logger.log(`Recalculated marks-based scores for ${fixed} existing session(s)`);
    return fixed;
  }
}
