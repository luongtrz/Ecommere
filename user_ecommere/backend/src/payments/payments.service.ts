import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { StripeAdapter } from './adapters/stripe.adapter';
import { MoMoAdapter } from './adapters/momo.adapter';
import { PaymentMethod } from './dtos/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private stripeAdapter: StripeAdapter,
    private momoAdapter: MoMoAdapter,
    private configService: ConfigService,
  ) {}

  private ensurePaymentProviderConfigured() {
    if (this.configService.get('NODE_ENV') === 'production') {
      throw new ServiceUnavailableException('Payment provider is not configured');
    }
  }

  async createPayment(userId: string, orderId: string, method: PaymentMethod) {
    this.ensurePaymentProviderConfigured();

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('Order payment is not pending');
    }

    const provider = method === PaymentMethod.STRIPE ? this.stripeAdapter : this.momoAdapter;

    const result = await provider.createPayment(orderId, order.total, 'VND');

    return {
      ...result,
      order: {
        id: order.id,
        code: order.code,
        total: order.total,
      },
    };
  }

  async verifyPayment(paymentId: string, method: PaymentMethod) {
    this.ensurePaymentProviderConfigured();

    const provider = method === PaymentMethod.STRIPE ? this.stripeAdapter : this.momoAdapter;

    const verification = await provider.verifyPayment(paymentId);

    // In production, update order status based on verification
    // For now, this is a mock response

    return verification;
  }

  async processPaymentWebhook(provider: string, payload: any) {
    // Webhooks must be implemented per provider with signature verification
    // before this endpoint can safely accept external requests.
    throw new UnauthorizedException(
      `Webhook verification is not configured for ${provider}`,
    );
  }

  async refundPayment(orderId: string, method: PaymentMethod) {
    this.ensurePaymentProviderConfigured();

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Order has not been paid');
    }

    const provider = method === PaymentMethod.STRIPE ? this.stripeAdapter : this.momoAdapter;

    // Mock payment ID - in production, this would be stored with the order
    const mockPaymentId = `${method}_payment_${order.id}`;

    const result = await provider.refundPayment(mockPaymentId, order.total);

    // Update order status
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.REFUNDED,
        status: OrderStatus.REFUNDED,
      },
    });

    return result;
  }
}
