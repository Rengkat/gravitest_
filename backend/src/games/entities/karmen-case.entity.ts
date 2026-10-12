import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum KarmenZone {
  NW = 'nw',
  NE = 'ne',
  NC = 'nc',
  SW = 'sw',
  SE = 'se',
  SS = 'ss',
}

// One "case" in Where in Nigeria is Madam Karmen? — a state the player
// must identify from a clue. Admin-manageable (CRUD via
// KarmenCasesController) so this content can grow/change without a
// deploy, per the operator's explicit ask. Seeded once from the
// prototype's own hand-written content (see seed/karmen-seed-data.ts)
// so nothing already written gets thrown away.
@Entity('karmen_cases')
export class KarmenCase {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  capital!: string;

  @Column({ type: 'enum', enum: KarmenZone })
  zone!: KarmenZone;

  @Column({ type: 'varchar', length: 200 })
  slogan!: string;

  @Column({ type: 'varchar', length: 255 })
  minerals!: string;

  @Column({ type: 'text' })
  notable!: string;

  // Five differently-flavored clues — the game shows one at random per
  // round so replaying the same state doesn't feel identical.
  @Column({ type: 'text' })
  clueCulture!: string;

  @Column({ type: 'text' })
  clueFood!: string;

  @Column({ type: 'text' })
  clueLandmark!: string;

  @Column({ type: 'text' })
  clueLanguage!: string;

  @Column({ type: 'text' })
  clueMineral!: string;

  @Column({ type: 'text' })
  extraHint!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
