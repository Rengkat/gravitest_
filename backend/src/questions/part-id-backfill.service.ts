import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { assignPartIds } from './utils/assign-part-ids.util';
import { EssayPart } from './types/essay-part.interface';

const hasMissingId = (parts: EssayPart[]): boolean =>
  parts.some((p) => !p.id || (p.children?.length ? hasMissingId(p.children) : false));

/**
 * Questions saved before sub-question ids existed get their permanent ids
 * here, once, shortly after boot — so the frontend always has a stable id to
 * attach a sub-question's discussion to. Idempotent (a structure whose parts
 * all have ids is skipped) and never blocks startup.
 */
@Injectable()
export class PartIdBackfillService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PartIdBackfillService.name);

  constructor(@InjectRepository(Question) private readonly questions: Repository<Question>) {}

  onApplicationBootstrap(): void {
    // Deliberately not awaited: a large question bank must not delay the API coming up.
    setImmediate(() => {
      this.run().catch((e: Error) => this.logger.error(`Sub-question id backfill failed: ${e.message}`));
    });
  }

  async run(batchSize = 200): Promise<number> {
    let fixed = 0;
    let lastId = '';
    for (;;) {
      const batch = await this.questions
        .createQueryBuilder('q')
        .select(['q.id', 'q.structure'])
        .where('q.structure IS NOT NULL')
        .andWhere('q.id > :lastId', { lastId: lastId || '00000000-0000-0000-0000-000000000000' })
        .orderBy('q.id', 'ASC')
        .take(batchSize)
        .getMany();
      if (!batch.length) break;
      for (const q of batch) {
        if (q.structure?.length && hasMissingId(q.structure)) {
          await this.questions.update(q.id, { structure: assignPartIds(q.structure) ?? null });
          fixed++;
        }
      }
      lastId = batch[batch.length - 1].id;
    }
    if (fixed) this.logger.log(`Assigned permanent sub-question ids to ${fixed} existing question(s)`);
    return fixed;
  }
}
