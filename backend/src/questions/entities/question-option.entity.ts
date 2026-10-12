import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Question } from './question.entity';

@Entity('question_options')
export class QuestionOption {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'char', length: 1 })
  label!: string; // 'A', 'B', 'C', 'D'

  @Column({ type: 'text' })
  text!: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string | null; // option itself is an image

  @Column({ type: 'int' })
  order!: number; // display order

  @ManyToOne(() => Question, (q) => q.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question!: Question;
}
