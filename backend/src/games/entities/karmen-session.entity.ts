import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum KarmenSessionStatus {
  IN_PROGRESS = 'in_progress',
  WON = 'won', // tracked Madam Karmen through all 10 cases
  LOST = 'lost', // ran out of leads
  QUIT = 'quit',
}

export interface KarmenClueState {
  // Which of the 5 clue fields was shown for the current case, and
  // which 3 wrong-answer state IDs were offered alongside the correct
  // one — persisted so a page refresh mid-round doesn't reroll the
  // options the player is already looking at.
  clueField:
    | 'clueCulture'
    | 'clueFood'
    | 'clueLandmark'
    | 'clueLanguage'
    | 'clueMineral';
  choiceCaseIds: string[]; // 4 case IDs, shuffled, one is correct
}

@Entity('karmen_sessions')
@Index(['userId', 'createdAt'])
export class KarmenSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: KarmenSessionStatus, default: KarmenSessionStatus.IN_PROGRESS })
  status!: KarmenSessionStatus;

  // The 10 cases for this playthrough, in order — fixed at session
  // start (see GAME_LENGTH in the prototype) so anti-cramming is real:
  // a fresh random draw from the full admin-managed case pool every
  // single game, never a fixed sequence.
  @Column({ type: 'uuid', array: true })
  caseSequence!: string[];

  @Column({ type: 'int', default: 0 })
  currentIndex!: number;

  @Column({ type: 'jsonb', nullable: true })
  currentClue: KarmenClueState | null;

  @Column({ type: 'int', default: 0 })
  score!: number;

  @Column({ type: 'int', default: 3 })
  leads!: number;

  @Column({ type: 'int', default: 0 })
  streak!: number;

  @Column({ type: 'int', default: 3 })
  hintsLeft!: number;

  @Column({ type: 'int', default: 0 })
  interrogationsUsed!: number;

  @Column({ type: 'boolean', default: false })
  interrogationReady!: boolean;

  @Column({ type: 'uuid', nullable: true })
  pendingInterrogationId: string | null;

  @Column({ type: 'varchar', array: true, default: () => "'{}'" })
  achievements!: string[];

  @Column({ type: 'int', default: 0 })
  xpEarned!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @UpdateDateColumn()
  updatedAt!: Date;
}
