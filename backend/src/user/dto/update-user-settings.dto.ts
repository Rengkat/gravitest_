import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsString,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import {
  ThemePreference,
  FontSize,
  DashboardLayout,
  PrimaryGoal,
  PrivacyLevel,
} from 'src/common/enums/enums';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsEnum(ThemePreference)
  theme?: ThemePreference;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @IsEnum(FontSize)
  fontSize?: FontSize;

  @IsOptional()
  @IsEnum(DashboardLayout)
  dashboardLayout?: DashboardLayout;

  @IsOptional()
  @IsBoolean()
  showAvatar?: boolean;

  @IsOptional()
  @IsBoolean()
  collapseSidebar?: boolean;

  @IsOptional()
  @IsBoolean()
  colorVisionMode?: boolean;

  @IsOptional()
  @IsBoolean()
  highContrastMode?: boolean;

  @IsOptional()
  @IsBoolean()
  reducedMotion?: boolean;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsString()
  timeFormat?: string;

  @IsOptional()
  @IsEnum(PrimaryGoal)
  primaryGoal?: PrimaryGoal;

  @IsOptional()
  @IsBoolean()
  showExplanationAfterAnswer?: boolean;

  @IsOptional()
  @IsBoolean()
  autoSubmitOnTime?: boolean;

  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @IsOptional()
  @IsBoolean()
  shuffleOptions?: boolean;

  @IsOptional()
  @IsBoolean()
  showTimerDuringExam?: boolean;

  @IsOptional()
  @IsBoolean()
  enableStudyReminders?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  studyReminderTimes?: string[];

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  dailyStudyGoalMinutes?: number;

  @IsOptional()
  @IsBoolean()
  soundEffects?: boolean;

  @IsOptional()
  @IsBoolean()
  backgroundMusic?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  soundVolume?: number;

  @IsOptional()
  @IsEnum(PrivacyLevel)
  profileVisibility?: PrivacyLevel;

  @IsOptional()
  @IsBoolean()
  showOnLeaderboard?: boolean;

  @IsOptional()
  @IsBoolean()
  showStreak?: boolean;
}
