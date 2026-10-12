import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WordConnectPuzzle } from '../entities/word-connect-puzzle.entity';
import { WORD_CONNECT_SEED } from './word-connect-seed-data';

// Idempotent, same pattern as the other seeders — only inserts a puzzle
// if that (subjectKey, orderIndex) slot isn't already filled, so an
// admin's edits or additions are never clobbered on restart.
@Injectable()
export class WordConnectSeedService implements OnModuleInit {
  private readonly logger = new Logger(WordConnectSeedService.name);

  constructor(
    @InjectRepository(WordConnectPuzzle)
    private readonly puzzleRepo: Repository<WordConnectPuzzle>,
  ) {}

  async onModuleInit() {
    const existing = await this.puzzleRepo.find({ select: ['subjectKey', 'orderIndex'] });
    const taken = new Set(existing.map((p) => `${p.subjectKey}:${p.orderIndex}`));

    const toInsert = WORD_CONNECT_SEED.filter(
      (s) => !taken.has(`${s.subjectKey}:${s.orderIndex}`),
    );
    if (!toInsert.length) return;

    await this.puzzleRepo.save(
      toInsert.map((s) =>
        this.puzzleRepo.create({
          subjectKey: s.subjectKey,
          subjectName: s.subjectName,
          icon: s.icon,
          color: s.color,
          orderIndex: s.orderIndex,
          words: s.words,
          isActive: true,
        }),
      ),
    );
    this.logger.log(`Seeded ${toInsert.length} Word Connect puzzle(s).`);
  }
}
