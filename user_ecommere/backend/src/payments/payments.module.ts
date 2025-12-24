import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeAdapter } from './adapters/stripe.adapter';
import { MoMoAdapter } from './adapters/momo.adapter';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeAdapter, MoMoAdapter],
  exports: [PaymentsService],
})
export class PaymentsModule {}
