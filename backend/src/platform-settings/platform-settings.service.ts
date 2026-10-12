import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  DEFAULT_ACCENT_COLOR,
  PLATFORM_APPEARANCE_ID,
  PlatformAppearance,
} from './entities/platform-appearance.entity';
import { UpdatePlatformAppearanceDto } from './dto/update-platform-appearance.dto';

// How long an instance may serve its in-memory copy. Kept short on purpose:
// unlike AiSettings (a threshold nobody notices being a minute stale), an
// accent change is something an admin looks at immediately, and with more
// than one API instance behind a load balancer an indefinite per-process
// cache would leave some instances serving the old colour until restart.
const CACHE_TTL_MS = 30_000;

export interface PlatformAppearanceView {
  accentColor: string;
  updatedAt: Date;
}

@Injectable()
export class PlatformSettingsService {
  private readonly logger = new Logger(PlatformSettingsService.name);

  private cached: { value: PlatformAppearance; at: number } | null = null;

  constructor(
    @InjectRepository(PlatformAppearance)
    private readonly appearanceRepo: Repository<PlatformAppearance>,
  ) {}

  async getAppearance(): Promise<PlatformAppearanceView> {
    const row = await this.load();
    return { accentColor: row.accentColor, updatedAt: row.updatedAt };
  }

  async updateAppearance(
    dto: UpdatePlatformAppearanceDto,
    adminId: string | null,
  ): Promise<PlatformAppearanceView> {
    const row = await this.load(true);

    row.accentColor = dto.accentColor.toUpperCase();
    row.updatedById = adminId;

    const saved = await this.appearanceRepo.save(row);
    this.cached = { value: saved, at: Date.now() };

    this.logger.log(
      `Platform accent colour set to ${saved.accentColor} by ${adminId ?? 'unknown'}`,
    );
    return { accentColor: saved.accentColor, updatedAt: saved.updatedAt };
  }

  private async load(forceFresh = false): Promise<PlatformAppearance> {
    if (
      !forceFresh &&
      this.cached &&
      Date.now() - this.cached.at < CACHE_TTL_MS
    ) {
      return this.cached.value;
    }

    let row = await this.appearanceRepo.findOne({
      where: { id: PLATFORM_APPEARANCE_ID },
    });

    if (!row) {
      try {
        row = await this.appearanceRepo.save(
          this.appearanceRepo.create({
            id: PLATFORM_APPEARANCE_ID,
            accentColor: DEFAULT_ACCENT_COLOR,
            updatedById: null,
          }),
        );
        this.logger.log('Created default PlatformAppearance row');
      } catch {
        // Lost the race to another request creating the same singleton row
        // — it exists now, so just read it.
        row = await this.appearanceRepo.findOneOrFail({
          where: { id: PLATFORM_APPEARANCE_ID },
        });
      }
    }

    this.cached = { value: row, at: Date.now() };
    return row;
  }
}
