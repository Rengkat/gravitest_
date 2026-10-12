import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StudentProfile } from './student-profile.entity';
import { DifficultyLevel, Subject } from 'src/common/enums/enums';

// For tracking topic mastery over time (historical data)
@Entity('topic_mastery_history')
@Index(['subject', 'topic', 'recordedAt'])
export class TopicMasteryHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => StudentProfile, (profile) => profile.topicMasteryHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_profile_id' })
  studentProfile!: StudentProfile;

  // ── Topic Info ─────────────────────────────────────────────────────────
  @Column({ type: 'enum', enum: Subject })
  subject!: Subject;

  @Column({ type: 'varchar', length: 200 })
  topic!: string;

  // ── Mastery Data ───────────────────────────────────────────────────────
  @Column({ type: 'float' })
  masteryScore!: number; // 0–100

  @Column({ type: 'enum', enum: DifficultyLevel })
  level!: DifficultyLevel;

  @Column({ type: 'timestamptz' })
  recordedAt!: Date;

  // ── Timestamps ─────────────────────────────────────────────────────────
  @CreateDateColumn()
  createdAt!: Date;
}
