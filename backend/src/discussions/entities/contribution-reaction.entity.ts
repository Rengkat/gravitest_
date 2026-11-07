import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QuestionContribution } from './question-contribution.entity';

/** One user's reaction to one contribution: +1 (like) or -1 (dislike). Removing a reaction deletes the row. */
@Entity('contribution_reactions')
// The database — not application code — guarantees "one reaction per user per contribution".
@Index('UQ_reaction_contribution_user', ['contributionId', 'userId'], { unique: true })
export class ContributionReaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  contributionId!: string;

  @ManyToOne(() => QuestionContribution, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contributionId' })
  contribution?: QuestionContribution;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'smallint' })
  value!: 1 | -1;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
