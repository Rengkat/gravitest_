import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentGatewayCode } from 'src/common/enums/enums';
import { PaymentGateway } from './gateway.interface';
import { OpayGateway } from './gateways/opay.gateway';
import { PaystackGateway } from './gateways/paystack.gateway';

/**
 * Lookup of every implemented gateway by code. To add a provider: implement
 * PaymentGateway, add its code to PaymentGatewayCode, inject it here.
 *
 * Deliberately independent of the admin "enabled" flag: a gateway an admin has
 * switched off for NEW checkouts must still be resolvable so its webhooks and
 * in-flight payments keep being processed.
 */
@Injectable()
export class PaymentGatewayRegistry {
  private readonly gateways: Map<string, PaymentGateway>;

  constructor(paystack: PaystackGateway, opay: OpayGateway) {
    this.gateways = new Map<string, PaymentGateway>(
      [paystack, opay].map((g) => [g.code, g]),
    );
  }

  get(code: string): PaymentGateway {
    const gateway = this.gateways.get(code);
    if (!gateway) throw new BadRequestException(`Unknown payment gateway "${code}".`);
    return gateway;
  }

  has(code: string): code is PaymentGatewayCode {
    return this.gateways.has(code);
  }

  all(): PaymentGateway[] {
    return [...this.gateways.values()];
  }
}
