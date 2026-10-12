import { IsBoolean, IsOptional, IsString } from 'class-validator';

// update-notification-preferences.dto.ts
export class UpdateNotificationPreferencesDto {
  @IsOptional() @IsBoolean() inAppEnabled?: boolean;
  @IsOptional() @IsBoolean() emailEnabled?: boolean;
  @IsOptional() @IsBoolean() smsEnabled?: boolean;
  @IsOptional() @IsBoolean() pushEnabled?: boolean;
  @IsOptional() @IsBoolean() whatsappEnabled?: boolean;

  @IsOptional() @IsBoolean() examReminders?: boolean;
  @IsOptional() @IsBoolean() streakAlerts?: boolean;
  @IsOptional() @IsBoolean() newMessages?: boolean;
  @IsOptional() @IsBoolean() paymentNotifications?: boolean;
  @IsOptional() @IsBoolean() subscriptionAlerts?: boolean;
  @IsOptional() @IsBoolean() resultPublished?: boolean;
  @IsOptional() @IsBoolean() newContentAlerts?: boolean;
  @IsOptional() @IsBoolean() achievementAlerts?: boolean;
  @IsOptional() @IsBoolean() leaderboardUpdates?: boolean;
  @IsOptional() @IsBoolean() weeklyReports?: boolean;

  @IsOptional() @IsBoolean() quietHoursEnabled?: boolean;
  @IsOptional() @IsString() quietHoursStart?: string;
  @IsOptional() @IsString() quietHoursEnd?: string;

  @IsOptional() @IsString() whatsappNumber?: string;
  @IsOptional() @IsBoolean() weeklyWhatsappReport?: boolean;

  @IsOptional()
  @IsString()
  emailDigestFrequency?: 'instant' | 'daily' | 'weekly' | 'never';
}
