import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import {
  NotificationChannel,
  NotificationType,
  BroadcastAudienceType,
  BroadcastStatus,
} from 'src/common/enums/enums';

// ─── Create a broadcast campaign ───────────────────────────────────────────
// Backs the admin dashboard's "Compose broadcast" form.

export class CreateAdminBroadcastDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  emailSubject?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @IsEnum(BroadcastAudienceType)
  audienceType: BroadcastAudienceType;

  @ValidateIf((o) => o.audienceType === BroadcastAudienceType.SEGMENT)
  @IsOptional()
  @IsString()
  tier?: string;

  @ValidateIf((o) => o.audienceType === BroadcastAudienceType.SEGMENT)
  @IsOptional()
  @IsString()
  examType?: string;

  @ValidateIf((o) => o.audienceType === BroadcastAudienceType.SPECIFIC)
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  userIds?: string[];

  @IsOptional()
  @IsDateString()
  scheduledFor?: string | null; // ISO date — omit/null to send immediately
}

// ─── Admin query — list past/queued campaigns ──────────────────────────────

export class AdminBroadcastFiltersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(BroadcastStatus)
  status?: BroadcastStatus;

  @IsOptional()
  @IsIn(['createdAt', 'scheduledFor', 'sentAt'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
