import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Subject } from 'src/common/enums/enums';

export enum GameSlug {
  WHO_WANTS_TO_BE_A_SCHOLAR = 'who-wants-to-be-a-scholar',
  // Future games (Madam Karmen, Nigerian Trail, Word Connect, Algebra
  // Heist, etc.) get their own slug here once their prototypes land —
  // this entity is deliberately generic enough to carry any of them.
}

export enum GameSessionStatus {
  IN_PROGRESS = 'in_progress',
  WON = 'won', // reached the end of the question set
  LOST = 'lost', // answered wrong — walks away with the guaranteed prize
  QUIT = 'quit', // walked away voluntarily
}

export interface GameLifelinesUsed {
  ll50?: boolean;
  phone?: boolean;
  crowd?: boolean;
  skip?: boolean;
}

@Entity('game_sessions')
@Index(['userId', 'gameSlug', 'createdAt'])
export class GameSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: GameSlug })
  gameSlug!: GameSlug;

  @Column({ type: 'enum', enum: Subject })
  subject!: Subject;

  @Column({ type: 'enum', enum: GameSessionStatus, default: GameSessionStatus.IN_PROGRESS })
  status!: GameSessionStatus;

  // Ordered question IDs for this playthrough — fixed at session start so
  // "next question" always means the same thing even across requests.
  // Never sent to the client with correct answers attached; see
  // GamesService.sanitizeQuestion().
  @Column({ type: 'uuid', array: true })
  questionIds!: string[];

  // Index into questionIds of the question currently being answered.
  @Column({ type: 'int', default: 0 })
  currentIndex!: number;

  @Column({ type: 'jsonb', default: {} })
  lifelinesUsed!: GameLifelinesUsed;

  // Which two (wrong) option labels 50:50 removed for the current
  // question, if used — so a page refresh mid-question doesn't un-remove
  // them and let the student re-roll the lifeline's effect.
  @Column({ type: 'varchar', array: true, nullable: true })
  fiftyFiftyRemoved: string[] | null;

  @Column({ type: 'int', default: 0 })
  prizeWon!: number;

  @Column({ type: 'int', default: 0 })
  correctCount!: number;

  @Column({ type: 'int', default: 0 })
  xpEarned!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @UpdateDateColumn()
  updatedAt!: Date;
}
