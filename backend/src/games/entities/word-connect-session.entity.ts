import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum WordConnectSessionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed', // played through every level in the subject
  QUIT = 'quit',
}

@Entity('word_connect_sessions')
@Index(['userId', 'createdAt'])
export class WordConnectSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 50 })
  subjectKey!: string;

  @Column({
    type: 'enum',
    enum: WordConnectSessionStatus,
    default: WordConnectSessionStatus.IN_PROGRESS,
  })
  status!: WordConnectSessionStatus;

  // The shuffled puzzle order for this playthrough — fixed at session
  // start so "next level" is unambiguous across requests, and reshuffled
  // fresh every new game so the level order is never memorizable.
  @Column({ type: 'uuid', array: true })
  puzzleSequence!: string[];

  @Column({ type: 'int', default: 0 })
  currentIndex!: number;

  // Words already solved in the CURRENT puzzle, by uppercase word text.
  @Column({ type: 'varchar', array: true, default: () => "'{}'" })
  solvedWords!: string[];

  @Column({ type: 'int', default: 3 })
  lives!: number;

  @Column({ type: 'int', default: 0 })
  cash!: number;

  @Column({ type: 'int', default: 0 })
  totalWordsSolved!: number;

  @Column({ type: 'int', default: 0 })
  xpEarned!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @UpdateDateColumn()
  updatedAt!: Date;
}
