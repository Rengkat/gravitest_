import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import {
  DashboardLayout,
  FontSize,
  PrimaryGoal,
  PrivacyLevel,
  ThemePreference,
} from '../../common/enums/enums';
import { User } from './user.entity';

@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ── UI / Appearance ────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: ThemePreference,
    default: ThemePreference.SYSTEM,
  })
  theme!: ThemePreference;

  @Column({ type: 'varchar', length: 7, default: '#4F46E5' })
  accentColor!: string; // HEX e.g. '#4F46E5'

  @Column({ type: 'enum', enum: FontSize, default: FontSize.MEDIUM })
  fontSize!: FontSize;

  @Column({
    type: 'enum',
    enum: DashboardLayout,
    default: DashboardLayout.DEFAULT,
  })
  dashboardLayout!: DashboardLayout;

  @Column({ type: 'boolean', default: true })
  showAvatar!: boolean;

  @Column({ type: 'boolean', default: false })
  collapseSidebar!: boolean;

  // ── Accessibility ──────────────────────────────────────────
  @Column({ type: 'boolean', default: false })
  colorVisionMode!: boolean; // Deuteranopia / protanopia friendly palette

  @Column({ type: 'boolean', default: false })
  highContrastMode!: boolean;

  @Column({ type: 'boolean', default: false })
  reducedMotion!: boolean;

  // ── Locale ─────────────────────────────────────────────────
  @Column({ type: 'varchar', length: 10, default: 'en' })
  language!: string; // ISO 639-1 e.g. 'en', 'ha', 'yo', 'ig'

  @Column({ type: 'varchar', length: 50, default: 'Africa/Lagos' })
  timezone!: string;

  @Column({ type: 'varchar', length: 20, default: 'DD/MM/YYYY' })
  dateFormat!: string;

  @Column({ type: 'varchar', length: 10, default: '24h' })
  timeFormat!: string; // '12h' | '24h'

  // ── Study Preferences ──────────────────────────────────────
  @Column({ type: 'enum', enum: PrimaryGoal, default: PrimaryGoal.EXAM_PREP })
  primaryGoal!: PrimaryGoal;

  @Column({ type: 'boolean', default: true })
  showExplanationAfterAnswer!: boolean;

  @Column({ type: 'boolean', default: true })
  autoSubmitOnTime!: boolean; // Auto-submit CBT when timer hits zero

  @Column({ type: 'boolean', default: false })
  shuffleQuestions!: boolean;

  @Column({ type: 'boolean', default: false })
  shuffleOptions!: boolean;

  @Column({ type: 'boolean', default: true })
  showTimerDuringExam!: boolean;

  @Column({ type: 'boolean', default: true })
  enableStudyReminders!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  studyReminderTimes: string[] | null; // ['07:00', '20:00'] — HH:mm

  @Column({ type: 'int', default: 60 })
  dailyStudyGoalMinutes!: number;

  // ── Sound & Media ──────────────────────────────────────────
  @Column({ type: 'boolean', default: true })
  soundEffects!: boolean;

  @Column({ type: 'boolean', default: true })
  backgroundMusic!: boolean;

  @Column({ type: 'int', default: 70 })
  soundVolume!: number; // 0–100

  // ── Privacy ────────────────────────────────────────────────
  @Column({ type: 'enum', enum: PrivacyLevel, default: PrivacyLevel.PUBLIC })
  profileVisibility!: PrivacyLevel;

  @Column({ type: 'boolean', default: true })
  showOnLeaderboard!: boolean;

  @Column({ type: 'boolean', default: true })
  showStreak!: boolean;

  // ── Integrations ───────────────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  connectedIntegrations: {
    google?: { connected: boolean; email: string };
    whatsapp?: { connected: boolean; phone: string };
  } | null;

  // ── Timestamps ─────────────────────────────────────────────
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ── Relations ──────────────────────────────────────────────
  @OneToOne(() => User, (u) => u.settings)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
