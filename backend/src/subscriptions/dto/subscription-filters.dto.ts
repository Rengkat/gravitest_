import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { SubscriptionStatus, SubscriptionTier } from 'src/common/enums/enums';

export class SubscriptionFiltersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsEnum(SubscriptionTier)
  tier?: SubscriptionTier;

  @IsOptional()
  @IsIn(['createdAt', 'startedAt', 'expiresAt'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
