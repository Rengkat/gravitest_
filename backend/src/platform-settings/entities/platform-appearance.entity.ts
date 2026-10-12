import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

// The accent colour the whole platform ships with. Must stay in sync with
// DEFAULT_ACCENT in the client (lib/theme/accent.ts) — the client treats
// this exact value as "use the original green palette, untouched".
export const DEFAULT_ACCENT_COLOR = '#2E8B57';

// Fixed primary key for the one-and-only row. A fixed key (rather than a
// generated uuid + "find the first row") makes the lazy create in
// PlatformSettingsService.getAppearance() race-safe: if two requests try to
// create it at the same moment, the second insert hits the PK constraint and
// simply re-reads the row the first one made.
export const PLATFORM_APPEARANCE_ID = 'singleton';

// Singleton table — platform-wide look & feel that ONLY admins control and
// that every user (students included) sees. Per-user preferences such as
// light/dark theme and font size deliberately live in UserSettings instead.
@Entity('platform_appearance')
export class PlatformAppearance {
  @PrimaryColumn({ type: 'varchar', length: 20, default: PLATFORM_APPEARANCE_ID })
  id!: string;

  // HEX, always stored upper-case with a leading '#', e.g. '#2E8B57'.
  @Column({ type: 'varchar', length: 7, default: DEFAULT_ACCENT_COLOR })
  accentColor!: string;

  // Which admin last changed it (audit trail; not a FK so deleting an admin
  // never blocks or cascades into branding).
  @Column({ type: 'uuid', nullable: true })
  updatedById!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
