import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Question } from './question.entity';

@Entity('question_answers')
export class QuestionAnswer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'char', length: 1 })
  correctLabel!: string; // 'A', 'B', 'C' or 'D'

  @Column({ type: 'uuid' })
  correctOptionId!: string; // FK to question_options

  @OneToOne(() => Question, (q) => q.answer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question!: Question;
}
