import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { TransactionsService } from './transactions.service';
import { TransactionFiltersDto } from './dto/transaction-filters.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/enums';

// Admin-facing "Transactions" dashboard — platform-wide view across every
// module that charges users. @Roles() alone (no explicit RolesGuard) to
// match the pattern in your UserController — remove the comment below and
// add @UseGuards(JwtAuthGuard, RolesGuard) instead if RolesGuard isn't
// registered globally via APP_GUARD in your app.
@ApiTags('Transactions (Admin)')
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Platform-wide revenue and transaction stats' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  getStats() {
    return this.transactionsService.getAdminStats();
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'List / search all transactions (platform-wide)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Matches reference or user ID',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  findAll(@Query() filters: TransactionFiltersDto) {
    return this.transactionsService.findAllForAdmin(filters);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a single transaction by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transactionsService.findOne(id);
  }

  // Manual reconciliation tool — re-checks a stuck/pending transaction
  // against Paystack directly, in case a webhook was ever missed.
  @Post(':id/verify')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Re-verify a transaction against Paystack' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Transaction re-verified' })
  async reverify(@Param('id', ParseUUIDPipe) id: string) {
    const transaction = await this.transactionsService.findOne(id);
    return this.transactionsService.verifyTransaction(transaction.reference);
  }
}
