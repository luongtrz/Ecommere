import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProvider,
  PaymentResult,
  PaymentVerification,
  RefundResult,
} from '../interfaces/payment-provider.interface';

@Injectable()
export class MoMoAdapter implements PaymentProvider {
  private readonly logger = new Logger(MoMoAdapter.name);

  getName(): string {
    return 'MoMo';
  }

  async createPayment(orderId: string, amount: number, currency: string): Promise<PaymentResult> {
    this.logger.log(`[MOCK] Creating MoMo payment for order ${orderId}`);
    this.logger.log(`[MOCK] Amount: ${amount} ${currency}`);

    // Mock implementation - In production, integrate with MoMo API
    // const crypto = require('crypto');
    // const partnerCode = process.env.MOMO_PARTNER_CODE;
    // const accessKey = process.env.MOMO_ACCESS_KEY;
    // const secretKey = process.env.MOMO_SECRET_KEY;
    // Generate signature and call MoMo API

    const mockPaymentId = `momo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      paymentId: mockPaymentId,
      paymentUrl: `https://payment.momo.vn/mock/${mockPaymentId}`,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?data=MOMO_${mockPaymentId}&size=300x300`,
      message: 'Mock MoMo payment created. In production, this would return a real MoMo payment request.',
      metadata: {
        provider: 'momo',
        orderId,
        amount,
        currency,
      },
    };
  }

  async verifyPayment(paymentId: string): Promise<PaymentVerification> {
    this.logger.log(`[MOCK] Verifying MoMo payment ${paymentId}`);

    // Mock implementation - In production:
    // Call MoMo transaction status API with proper signature

    return {
      success: true,
      status: 'completed',
      transactionId: `momo_txn_${Date.now()}`,
      message: 'Mock MoMo payment verification successful',
    };
  }

  async refundPayment(paymentId: string, amount: number): Promise<RefundResult> {
    this.logger.log(`[MOCK] Refunding MoMo payment ${paymentId}, amount: ${amount}`);

    // Mock implementation - In production:
    // Call MoMo refund API with proper signature

    return {
      success: true,
      refundId: `momo_refund_${Date.now()}`,
      amount,
      message: 'Mock MoMo refund processed successfully',
    };
  }
}
