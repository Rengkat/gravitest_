import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import type { User } from '../../user/entities/user.entity';
import { ExamType } from 'src/common/enums/enums';
import { WeakTopic } from './weak-topic.entity';
import { ExamSession } from './exam-session.entity';
import { StudyStreak } from './study-streak.entity';
import { TopicMasteryHistory } from './topic-mastery-history.entity';
import { StudyActivity } from './study-activity.entity';
// import type { AiChatSession } from './ai-chat-session.entity';

@Entity('student_profiles')
@Index(['leaderboardRank'])
@Index(['totalXp'])
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ── Academic Info ──────────────────────────────────────────
  @Column({ type: 'varchar', length: 200, nullable: true })
  currentSchool: string | null; // Free-text for self-registered students

  @Column({ type: 'varchar', length: 100, nullable: true })
  currentClass: string | null; // e.g. 'SS2', 'JSS3', '200 Level'

  @Column({ type: 'int', nullable: true })
  graduationYear: number | null;

  // ── Exam Targets ───────────────────────────────────────────
  @Column({ type: 'enum', enum: ExamType, array: true, default: '{}' })
  examTargets: ExamType[];

  @Column({ type: 'date', nullable: true })
  examDate: Date | null;

  @Column({ type: 'int', nullable: true })
  targetScore: number | null; // Out of 400 for JAMB, 100 for WAEC, etc.

  @Column({ type: 'varchar', length: 200, nullable: true })
  targetUniversity: string | null; // e.g. 'UNILAG', 'UI', 'OAU'

  @Column({ type: 'varchar', length: 100, nullable: true })
  targetCourse: string | null; // e.g. 'Medicine and Surgery'

  // ── Subjects ───────────────────────────────────────────────
  @Column({ type: 'varchar', array: true, default: '{}' })
  focusSubjects: string[]; // ['physics', 'mathematics', 'chemistry']

  // ── Gamification ───────────────────────────────────────────
  @Column({ type: 'int', default: 0 })
  totalXp!: number;

  @Column({ type: 'int', default: 1 })
  level!: number; // Computed from XP brackets

  @Column({ type: 'varchar', length: 50, default: 'Beginner' })
  levelTitle!: string; // e.g. 'Beginner', 'Scholar', 'Champion'

  @Column({ type: 'int', default: 0 })
  totalBadges!: number;

  @Column({ type: 'int', default: 0 })
  streakShields!: number; // Freeze tokens for streak protection

  // ── Streak Cache (source of truth = StudyStreak entity) ────
  @Column({ type: 'int', default: 0 })
  currentStreak!: number;

  @Column({ type: 'int', default: 0 })
  longestStreak!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastStudyDate: Date | null;

  // ── Performance Cache (updated by cron/triggers) ───────────
  @Column({ type: 'float', default: 0 })
  averageScore!: number; // Overall average across all exams

  @Column({ type: 'int', default: 0 })
  totalQuestionsAttempted!: number;

  @Column({ type: 'int', default: 0 })
  totalQuestionsCorrect!: number;

  @Column({ type: 'int', default: 0 })
  totalExamsTaken!: number;

  @Column({ type: 'int', default: 0 })
  totalMinutesStudied!: number;

  @Column({ type: 'float', nullable: true })
  bestScore: number | null;

  @Column({ type: 'float', nullable: true })
  worstScore: number | null;

  // ── Per-Subject Performance Cache ──────────────────────────
  // Full detail lives in ExamSession/StudyActivity. This is a fast-read cache.
  @Column({ type: 'jsonb', nullable: true })
  subjectPerformance: {
    [subject: string]: {
      averageScore: number;
      questionsAttempted: number;
      questionsCorrect: number;
      totalMinutes: number;
      lastPracticedAt: string; // ISO date
    };
  } | null;

  // ── Per-Exam Performance Cache ─────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  examPerformance: {
    [examType: string]: {
      examsTaken: number;
      bestScore: number;
      worstScore: number;
      averageScore: number;
      lastAttemptAt: string;
    };
  } | null;

  // ── Leaderboard ────────────────────────────────────────────
  @Column({ type: 'int', nullable: true })
  leaderboardRank: number | null; // National rank (cached by cron)

  @Column({ type: 'float', nullable: true })
  percentileStanding: number | null; // e.g. 94.5 = top 5.5%

  // ── Social / Contact ───────────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  socialLinks: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  } | null;

  // ── Timestamps ─────────────────────────────────────────────
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ── Relations ──────────────────────────────────────────────
  @OneToOne('User', (u: User) => u.studentProfile)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany('WeakTopic', (w: WeakTopic) => w.studentProfile)
  weakTopics: WeakTopic[];

  @OneToMany('StudyStreak', (s: StudyStreak) => s.studentProfile)
  streakHistory: StudyStreak[];

  @OneToMany('StudyActivity', (a: StudyActivity) => a.studentProfile)
  studyActivities: StudyActivity[];

  @OneToMany(
    'TopicMasteryHistory',
    (h: TopicMasteryHistory) => h.studentProfile,
  )
  topicMasteryHistory: TopicMasteryHistory[];

  @OneToMany('ExamSession', (s: ExamSession) => s.studentProfile)
  examSessions: ExamSession[];

  // @OneToMany('AiChatSession', (s: AiChatSession) => s.studentProfile)
  // aiChatSessions: AiChatSession[];

  // ── Domain Methods ─────────────────────────────────────────
  get accuracyRate(): number {
    if (!this.totalQuestionsAttempted) return 0;
    return (this.totalQuestionsCorrect / this.totalQuestionsAttempted) * 100;
  }

  addXp(points: number): void {
    this.totalXp += points;
    this.recalculateLevel();
  }

  private recalculateLevel(): void {
    // Level brackets: 0=1, 500=2, 1500=3, 3000=4, 5000=5, 10000=6 ...
    const brackets = [0, 500, 1500, 3000, 5000, 10000, 20000, 50000];
    const titles = [
      'Beginner',
      'Learner',
      'Scholar',
      'Achiever',
      'Expert',
      'Master',
      'Champion',
      'Legend',
    ];
    let level = 1;
    for (let i = 0; i < brackets.length; i++) {
      if (this.totalXp >= brackets[i]) level = i + 1;
    }
    this.level = level;
    this.levelTitle = titles[level - 1] ?? 'Legend';
  }
}
