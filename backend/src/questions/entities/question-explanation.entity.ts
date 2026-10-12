import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Question } from './question.entity';

@Entity('question_explanations')
export class QuestionExplanation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  text!: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string | null; // explanation can also have a diagram

  @Column({ type: 'varchar', nullable: true })
  videoUrl: string | null; // video explanation

  @ManyToOne(() => Question, (q) => q.explanations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question!: Question;
}
