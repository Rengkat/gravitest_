import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { AdminAlertPriority, AdminAlertStatus, AdminAlertType } from 'src/common/enums/enums';

export class AdminAlertFiltersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(AdminAlertStatus)
  status?: AdminAlertStatus;

  @IsOptional()
  @IsEnum(AdminAlertType)
  type?: AdminAlertType;

  @IsOptional()
  @IsEnum(AdminAlertPriority)
  priority?: AdminAlertPriority;

  @IsOptional()
  @IsIn(['createdAt', 'resolvedAt', 'priority'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
