import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';

import paystackConfig from 'src/config/paystackConfig';
import opayConfig from 'src/config/opayConfig';
import { PaymentGatewayConfig } from './entities/payment-gateway-config.entity';
import { PaystackGateway } from './gateways/paystack.gateway';
import { OpayGateway } from './gateways/opay.gateway';
import { PaymentGatewayRegistry } from './payment-gateway.registry';
import { PaymentGatewaysService } from './payment-gateways.service';
import { PaymentGatewaysController } from './payment-gateways.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentGatewayConfig]),
    ConfigModule.forFeature(paystackConfig),
    ConfigModule.forFeature(opayConfig),
    HttpModule.register({ timeout: 15000 }),
  ],
  controllers: [PaymentGatewaysController],
  providers: [PaystackGateway, OpayGateway, PaymentGatewayRegistry, PaymentGatewaysService],
  exports: [PaymentGatewayRegistry, PaymentGatewaysService, PaystackGateway],
})
export class PaymentsModule {}
