import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExamType, Subject } from 'src/common/enums/enums';
import { Question } from './question.entity';

/**
 * A shared passage, comprehension text, or diagram that several questions
 * refer back to — e.g. "Read the passage below and answer questions 1–5"
 * (JAMB/WAEC English comprehension) or a single diagram feeding a run of
 * Physics/Geography questions. A Question with no passageId is a normal
 * standalone question; one with a passageId is part of a set that should
 * be presented together with the passage shown once above the group.
 */
@Entity('passages')
export class Passage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: ExamType })
  examType!: ExamType;

  @Column({ type: 'enum', enum: Subject })
  subject!: Subject;

  @Column({ type: 'int' })
  year!: number;

  // Short internal label shown in the admin UI, e.g. "Passage 1" or
  // "Comprehension — The Water Cycle". Never required from the student.
  @Column({ type: 'varchar', length: 150, nullable: true })
  title: string | null;

  // Optional short instruction shown above the passage, e.g. "Read the
  // passage carefully and answer the questions that follow."
  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  // The comprehension text itself. Nullable because a passage can be
  // image-only (a diagram with no accompanying text).
  @Column({ type: 'text', nullable: true })
  passageText: string | null;

  // A diagram/chart/image the questions refer to (map reading, circuit
  // diagrams, data tables rendered as an image, etc.)
  @Column({ type: 'varchar', nullable: true })
  passageImageUrl: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Question, (q) => q.passage)
  questions: Question[];

  // Populated only by PassagesService.findAll() via
  // loadRelationCountAndMap — not a real column.
  questionCount?: number;
}
