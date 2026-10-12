import {
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import {
  PaymentGatewayCode,
  TransactionStatus,
  TransactionType,
} from 'src/common/enums/enums';

export class TransactionFiltersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsEnum(PaymentGatewayCode)
  gateway?: PaymentGatewayCode;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  // Matches against reference or paystackReference (admin search box)
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['createdAt', 'amountKobo', 'paidAt'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
