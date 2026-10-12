import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettings } from '../entities/user-settings.entity';
import { UpdateUserSettingsDto } from '../dto/update-user-settings.dto';

@Injectable()
export class UserSettingsProvider {
  private readonly logger = new Logger(UserSettingsProvider.name);

  constructor(
    @InjectRepository(UserSettings)
    private readonly settingsRepository: Repository<UserSettings>,
  ) {}

  // Every normal signup path creates a UserSettings row alongside the user
  // (see CreateUserProvider, the bulk-import provider, user.service.ts), so
  // a missing row should never happen — but when it does (an account created
  // outside those paths, e.g. a seed script or a pre-settings-feature
  // account never backfilled), lazy-create one here instead of 404ing.
  // Without this, GET /users/me/settings fails permanently for that account:
  // the settings page can only ever show defaults, and every save attempt
  // fails too, since updateSettings() itself calls getSettings() first.
  async getSettings(userId: string): Promise<UserSettings> {
    const settings = await this.settingsRepository.findOne({
      where: { user: { id: userId } },
    });

    if (settings) return settings;

    try {
      const created = this.settingsRepository.create({ user: { id: userId } as any });
      const saved = await this.settingsRepository.save(created);
      this.logger.warn(`No settings row for user ${userId} — created defaults`);
      return saved;
    } catch {
      // Lost a create race to a concurrent request — the row exists now.
      const raced = await this.settingsRepository.findOne({ where: { user: { id: userId } } });
      if (raced) return raced;
      throw new NotFoundException('Settings not found');
    }
  }

  async updateSettings(
    userId: string,
    dto: UpdateUserSettingsDto,
  ): Promise<UserSettings> {
    const settings = await this.getSettings(userId);

    // Only update fields that were explicitly sent
    if (dto.theme !== undefined) settings.theme = dto.theme;
    if (dto.accentColor !== undefined) settings.accentColor = dto.accentColor;
    if (dto.fontSize !== undefined) settings.fontSize = dto.fontSize;
    if (dto.dashboardLayout !== undefined)
      settings.dashboardLayout = dto.dashboardLayout;
    if (dto.showAvatar !== undefined) settings.showAvatar = dto.showAvatar;
    if (dto.collapseSidebar !== undefined)
      settings.collapseSidebar = dto.collapseSidebar;

    // Accessibility
    if (dto.colorVisionMode !== undefined)
      settings.colorVisionMode = dto.colorVisionMode;
    if (dto.highContrastMode !== undefined)
      settings.highContrastMode = dto.highContrastMode;
    if (dto.reducedMotion !== undefined)
      settings.reducedMotion = dto.reducedMotion;

    // Locale
    if (dto.language !== undefined) settings.language = dto.language;
    if (dto.timezone !== undefined) settings.timezone = dto.timezone;
    if (dto.dateFormat !== undefined) settings.dateFormat = dto.dateFormat;
    if (dto.timeFormat !== undefined) settings.timeFormat = dto.timeFormat;

    // Study preferences
    if (dto.primaryGoal !== undefined) settings.primaryGoal = dto.primaryGoal;
    if (dto.showExplanationAfterAnswer !== undefined)
      settings.showExplanationAfterAnswer = dto.showExplanationAfterAnswer;
    if (dto.autoSubmitOnTime !== undefined)
      settings.autoSubmitOnTime = dto.autoSubmitOnTime;
    if (dto.shuffleQuestions !== undefined)
      settings.shuffleQuestions = dto.shuffleQuestions;
    if (dto.shuffleOptions !== undefined)
      settings.shuffleOptions = dto.shuffleOptions;
    if (dto.showTimerDuringExam !== undefined)
      settings.showTimerDuringExam = dto.showTimerDuringExam;
    if (dto.enableStudyReminders !== undefined)
      settings.enableStudyReminders = dto.enableStudyReminders;
    if (dto.studyReminderTimes !== undefined)
      settings.studyReminderTimes = dto.studyReminderTimes;
    if (dto.dailyStudyGoalMinutes !== undefined)
      settings.dailyStudyGoalMinutes = dto.dailyStudyGoalMinutes;

    // Sound
    if (dto.soundEffects !== undefined)
      settings.soundEffects = dto.soundEffects;
    if (dto.backgroundMusic !== undefined)
      settings.backgroundMusic = dto.backgroundMusic;
    if (dto.soundVolume !== undefined) settings.soundVolume = dto.soundVolume;

    // Privacy
    if (dto.profileVisibility !== undefined)
      settings.profileVisibility = dto.profileVisibility;
    if (dto.showOnLeaderboard !== undefined)
      settings.showOnLeaderboard = dto.showOnLeaderboard;
    if (dto.showStreak !== undefined) settings.showStreak = dto.showStreak;
    const saved = await this.settingsRepository.save(settings);

    this.logger.log(`Settings updated for user ${userId}`);

    return saved;
  }
}
