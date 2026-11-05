import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * One editable "page section" document (e.g. `home.hero`, `site.contact`).
 * The shape of `data` is defined by BLOCK_DEFINITIONS and enforced on write.
 */
@Entity('site_blocks')
export class SiteBlock {
  @PrimaryColumn({ type: 'varchar', length: 80 })
  key!: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  data!: Record<string, unknown>;

  /** Which admin last saved it (audit trail; deliberately not a FK). */
  @Column({ type: 'uuid', nullable: true })
  updatedById!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
