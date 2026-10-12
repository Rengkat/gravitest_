import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KarmenCase } from '../entities/karmen-case.entity';
import { KarmenInterrogationQuestion } from '../entities/karmen-interrogation.entity';
import { KARMEN_CASE_SEED, KARMEN_INTERROGATION_SEED } from './karmen-seed-data';

// Runs on every boot, same idempotent pattern as AiSeedService — only
// inserts rows that don't already exist (matched by name/question text),
// so re-running it after an admin has edited or added cases never
// clobbers their changes.
@Injectable()
export class KarmenSeedService implements OnModuleInit {
  private readonly logger = new Logger(KarmenSeedService.name);

  constructor(
    @InjectRepository(KarmenCase)
    private readonly caseRepo: Repository<KarmenCase>,
    @InjectRepository(KarmenInterrogationQuestion)
    private readonly interrogationRepo: Repository<KarmenInterrogationQuestion>,
  ) {}

  async onModuleInit() {
    await this.seedCases();
    await this.seedInterrogations();
  }

  private async seedCases() {
    const existing = await this.caseRepo.find({ select: ['name'] });
    const existingNames = new Set(existing.map((c) => c.name));
    const toInsert = KARMEN_CASE_SEED.filter((s) => !existingNames.has(s.name));
    if (toInsert.length === 0) return;

    await this.caseRepo.save(toInsert.map((s) => this.caseRepo.create({ ...s, isActive: true })));
    this.logger.log(`Seeded ${toInsert.length} Madam Karmen case(s).`);
  }

  private async seedInterrogations() {
    const existing = await this.interrogationRepo.find({ select: ['question'] });
    const existingQuestions = new Set(existing.map((q) => q.question));
    const toInsert = KARMEN_INTERROGATION_SEED.filter((q) => !existingQuestions.has(q.question));
    if (toInsert.length === 0) return;

    await this.interrogationRepo.save(
      toInsert.map((q) => this.interrogationRepo.create({ ...q, isActive: true })),
    );
    this.logger.log(`Seeded ${toInsert.length} Madam Karmen interrogation question(s).`);
  }
}
