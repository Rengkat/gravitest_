import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface WordConnectWord {
  word: string;
  dir: 'h' | 'v';
  row: number;
  col: number;
  clue: string;
}

// One interlocking crossword puzzle for Word Connect. The words array is
// stored as jsonb rather than a child table because a puzzle's words are
// only ever read/written as a single unit — their grid coordinates only
// make sense together, and admins edit a whole puzzle at a time.
// Admin-manageable (see WordConnectAdminController) so the puzzle bank
// can grow without a deploy.
@Entity('word_connect_puzzles')
@Index(['subjectKey', 'isActive'])
export class WordConnectPuzzle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  subjectKey!: string;

  @Column({ type: 'varchar', length: 100 })
  subjectName!: string;

  @Column({ type: 'varchar', length: 10, default: '📚' })
  icon!: string;

  @Column({ type: 'varchar', length: 20, default: '#7eb8e8' })
  color!: string;

  @Column({ type: 'int', default: 0 })
  orderIndex!: number;

  @Column({ type: 'jsonb' })
  words!: WordConnectWord[];

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
