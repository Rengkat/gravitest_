import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Headers,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { TransactionsService } from './transactions.service';
import { Public } from 'src/auth/decorators/public.decorator';

// @Public() bypasses your global JwtAuthGuard (registered via APP_GUARD in
// AppModule) for this route only — required since Paystack's servers call
// this with no JWT. Trust is established purely via the HMAC signature
// check inside the service, not via authentication.
//
// Requires raw body access — main.ts sets `rawBody: true` on
// NestFactory.create() for exactly this reason (see the comment there).
// Not rate-limited: gateways deliver bursts from a few fixed IPs, and a dropped
// callback means a paid-but-unactivated customer. Auth is the signature check.
@SkipThrottle()
@ApiExcludeController()
@Controller('webhooks/paystack')
export class PaystackWebhookController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Req() req: Request & { rawBody: Buffer },
    @Headers('x-paystack-signature') signature: string,
  ) {
    await this.transactionsService.handleWebhook(req.rawBody, signature);
    return { received: true };
  }
}
