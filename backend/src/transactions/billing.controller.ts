import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { UserId } from 'src/auth/decorators/current-user.decorator';

// Student-facing "Billing" page — everything is implicitly scoped to the
// logged-in user. Same underlying data as /transactions, just self-service.
@ApiTags('Billing')
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('transactions')
  @ApiOperation({ summary: "Get the current user's transaction history" })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved' })
  getMyTransactions(
    @UserId() userId: string,
    @Query() filters: TransactionFiltersDto,
  ) {
    return this.transactionsService.findAllForUser(userId, filters);
  }

  @Get('transactions/:id')
  @ApiOperation({
    summary: 'Get a single transaction belonging to the current user',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Transaction retrieved' })
  getMyTransaction(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transactionsService.findOneForUser(id, userId);
  }

  // Called by the frontend after Paystack redirects back with
  // ?reference=xxx, so the UI can show a success/failure screen.
  @Get('verify/:reference')
  @ApiOperation({ summary: 'Verify a checkout by reference (post-redirect)' })
  @ApiParam({ name: 'reference', type: String })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verify(
    @UserId() userId: string,
    @Param('reference') reference: string,
  ) {
    // Scoped to the caller inside the service, before any gateway call is made.
    return this.transactionsService.verifyTransaction(reference, userId);
  }

  @Post('transactions/:id/resend-receipt')
  @ApiOperation({
    summary: 'Re-send the payment receipt email for a successful transaction',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Receipt email sent' })
  resendReceipt(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transactionsService.resendReceipt(userId, id);
  }

  @Get('payment-methods')
  @ApiOperation({ summary: "Get the current user's saved cards" })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved' })
  getMyPaymentMethods(@UserId() userId: string) {
    return this.transactionsService.listPaymentMethods(userId);
  }

  @Patch('payment-methods/:id/default')
  @ApiOperation({ summary: 'Set a saved card as default' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Default card updated' })
  setDefaultPaymentMethod(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transactionsService.setDefaultPaymentMethod(userId, id);
  }

  @Delete('payment-methods/:id')
  @ApiOperation({ summary: 'Remove a saved card' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Card removed' })
  removePaymentMethod(
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transactionsService.removePaymentMethod(userId, id);
  }
}
