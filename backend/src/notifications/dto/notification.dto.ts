import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  MaxLength,
  Min,
  IsNotEmpty,
  IsUrl,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from 'src/common/enums/enums';

// ─── Send single notification ─────────────────────────────────────────────────
// Used internally by other modules via NotificationsService.send()

export class SendNotificationDto {
  @IsUUID()
  userId!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsOptional()
  @IsUrl()
  actionUrl?: string | null;

  @IsOptional()
  metadata?: Record<string, unknown> | null;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string | null; // ISO date — for deferred notifications
}

// ─── Send to many users at once ───────────────────────────────────────────────

export class BroadcastNotificationDto {
  // Target: either explicit userIds OR a role/segment filter
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];

  @IsOptional()
  @IsString()
  targetRole?: string; // e.g. 'student', 'admin' — all users of this role

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsOptional()
  @IsUrl()
  actionUrl?: string | null;

  @IsOptional()
  metadata?: Record<string, unknown> | null;
}

// ─── Filter/query notifications (user inbox) ──────────────────────────────────

export class NotificationFiltersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsIn(['createdAt', 'readAt', 'type'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

// ─── Mark notifications read ──────────────────────────────────────────────────

export class MarkReadDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  ids?: string[]; // if omitted → mark ALL unread as read
}

// ─── Admin query — all notifications across users ─────────────────────────────

export class AdminNotificationFiltersDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsIn(['createdAt', 'type', 'status'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
