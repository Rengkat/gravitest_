import { Controller, HttpCode, HttpStatus, Post, Req, Headers } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { TransactionsService } from './transactions.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { PaymentGatewayCode } from 'src/common/enums/enums';

// OPay calls this server-to-server with no JWT, so it is @Public(). Trust comes
// from the HMAC-SHA3-512 signature in the body (verified inside OpayGateway),
// and — belt and braces — the payment state we act on is re-fetched from
// OPay's Status API rather than read from the callback.
//
// OPay treats any 200 as "received"; non-200 is retried. We therefore return
// 200 for everything we've processed OR deliberately ignored, 401/400 for
// forged/garbled requests, and 503 for transient failures we want retried.
// Not rate-limited: gateways deliver bursts from a few fixed IPs, and a dropped
// callback means a paid-but-unactivated customer. Auth is the signature check.
@SkipThrottle()
@ApiExcludeController()
@Controller('webhooks/opay')
export class OpayWebhookController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Req() req: Request & { rawBody: Buffer; headers: Record<string, any> },
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    await this.transactionsService.handleGatewayWebhook(
      PaymentGatewayCode.OPAY,
      req.rawBody,
      headers,
    );
    return { received: true };
  }
}
