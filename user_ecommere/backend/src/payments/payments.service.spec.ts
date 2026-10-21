import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { PrismaService } from '@/prisma/prisma.service';
import { StripeAdapter } from './adapters/stripe.adapter';
import { MoMoAdapter } from './adapters/momo.adapter';
import { PaymentMethod } from './dtos/create-payment.dto';
import {
  PaymentResult,
  PaymentVerification,
  RefundResult,
} from './interfaces/payment-provider.interface';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockStripeAdapter = {
    getName: jest.fn(),
    createPayment: jest.fn(),
    verifyPayment: jest.fn(),
    refundPayment: jest.fn(),
  };

  const mockMoMoAdapter = {
    getName: jest.fn(),
    createPayment: jest.fn(),
    verifyPayment: jest.fn(),
    refundPayment: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') {
        return 'test';
      }
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: StripeAdapter,
          useValue: mockStripeAdapter,
        },
        {
          provide: MoMoAdapter,
          useValue: mockMoMoAdapter,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ensurePaymentProviderConfigured', () => {
    it('should throw ServiceUnavailableException when NODE_ENV is production', () => {
      mockConfigService.get.mockReturnValue('production');

      expect(() => (service as any).ensurePaymentProviderConfigured()).toThrow(
        ServiceUnavailableException,
      );
      expect(() => (service as any).ensurePaymentProviderConfigured()).toThrow(
        'Payment provider is not configured',
      );
      expect(mockConfigService.get).toHaveBeenCalledWith('NODE_ENV');
    });

    it('should not throw when NODE_ENV is development', () => {
      mockConfigService.get.mockReturnValue('development');

      expect(() =>
        (service as any).ensurePaymentProviderConfigured(),
      ).not.toThrow();
      expect(mockConfigService.get).toHaveBeenCalledWith('NODE_ENV');
    });

    it('should not throw when NODE_ENV is test', () => {
      mockConfigService.get.mockReturnValue('test');

      expect(() =>
        (service as any).ensurePaymentProviderConfigured(),
      ).not.toThrow();
      expect(mockConfigService.get).toHaveBeenCalledWith('NODE_ENV');
    });

    it('should not throw when NODE_ENV is undefined', () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(() =>
        (service as any).ensurePaymentProviderConfigured(),
      ).not.toThrow();
      expect(mockConfigService.get).toHaveBeenCalledWith('NODE_ENV');
    });
  });

  describe('createPayment', () => {
    const userId = 'user-123';
    const orderId = 'order-456';
    const mockOrder = {
      id: orderId,
      code: 'ORD-2026-001',
      userId: userId,
      status: OrderStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.PENDING,
      total: 350000,
    };

    const mockStripeResult: PaymentResult = {
      success: true,
      paymentId: 'stripe_mock_789',
      paymentUrl: 'https://checkout.stripe.com/pay/mock_stripe_mock_789',
      message:
        'Mock Stripe payment created. In production, this would return a real Stripe payment intent.',
      metadata: {
        provider: 'stripe',
        orderId,
        amount: 350000,
        currency: 'VND',
      },
    };

    const mockMoMoResult: PaymentResult = {
      success: true,
      paymentId: 'momo_mock_789',
      paymentUrl: 'https://payment.momo.vn/mock/momo_mock_789',
      qrCode:
        'https://api.qrserver.com/v1/create-qr-code/?data=MOMO_momo_mock_789&size=300x300',
      message:
        'Mock MoMo payment created. In production, this would return a real MoMo payment request.',
      metadata: {
        provider: 'momo',
        orderId,
        amount: 350000,
        currency: 'VND',
      },
    };

    it('should throw ServiceUnavailableException when NODE_ENV is production', async () => {
      mockConfigService.get.mockReturnValue('production');

      await expect(
        service.createPayment(userId, orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow(ServiceUnavailableException);
      await expect(
        service.createPayment(userId, orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow('Payment provider is not configured');

      expect(mockConfigService.get).toHaveBeenCalledWith('NODE_ENV');
      expect(mockPrismaService.order.findUnique).not.toHaveBeenCalled();
      expect(mockStripeAdapter.createPayment).not.toHaveBeenCalled();
      expect(mockMoMoAdapter.createPayment).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when order is not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.createPayment(userId, orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createPayment(userId, orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow('Order not found');

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
      });
      expect(mockStripeAdapter.createPayment).not.toHaveBeenCalled();
      expect(mockMoMoAdapter.createPayment).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when order does not belong to the user', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        userId: 'other-user-999',
      });

      await expect(
        service.createPayment(userId, orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createPayment(userId, orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow('Unauthorized');

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
      });
      expect(mockStripeAdapter.createPayment).not.toHaveBeenCalled();
      expect(mockMoMoAdapter.createPayment).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when order status is not PENDING_PAYMENT', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
      });

      await expect(
        service.createPayment(userId, orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createPayment(userId, orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow('Order is not awaiting payment');

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
      });
      expect(mockStripeAdapter.createPayment).not.toHaveBeenCalled();
      expect(mockMoMoAdapter.createPayment).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when order paymentStatus is not PENDING', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.COMPLETED,
      });

      await expect(
        service.createPayment(userId, orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createPayment(userId, orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow('Order payment is not pending');

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
      });
      expect(mockStripeAdapter.createPayment).not.toHaveBeenCalled();
      expect(mockMoMoAdapter.createPayment).not.toHaveBeenCalled();
    });

    it('should successfully create payment using Stripe adapter when method is STRIPE', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockStripeAdapter.createPayment.mockResolvedValue(mockStripeResult);

      const result = await service.createPayment(
        userId,
        orderId,
        PaymentMethod.STRIPE,
      );

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
      });
      expect(mockStripeAdapter.createPayment).toHaveBeenCalledWith(
        orderId,
        mockOrder.total,
        'VND',
      );
      expect(mockMoMoAdapter.createPayment).not.toHaveBeenCalled();
      expect(result).toEqual({
        ...mockStripeResult,
        order: {
          id: mockOrder.id,
          code: mockOrder.code,
          total: mockOrder.total,
        },
      });
    });

    it('should successfully create payment using MoMo adapter when method is MOMO', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockMoMoAdapter.createPayment.mockResolvedValue(mockMoMoResult);

      const result = await service.createPayment(
        userId,
        orderId,
        PaymentMethod.MOMO,
      );

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
      });
      expect(mockMoMoAdapter.createPayment).toHaveBeenCalledWith(
        orderId,
        mockOrder.total,
        'VND',
      );
      expect(mockStripeAdapter.createPayment).not.toHaveBeenCalled();
      expect(result).toEqual({
        ...mockMoMoResult,
        order: {
          id: mockOrder.id,
          code: mockOrder.code,
          total: mockOrder.total,
        },
      });
    });

    it('should propagate error when Stripe adapter createPayment fails', async () => {
      const adapterError = new Error('Stripe API error: card processing failed');
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockStripeAdapter.createPayment.mockRejectedValue(adapterError);

      await expect(
        service.createPayment(userId, orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow(adapterError);

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
      });
      expect(mockStripeAdapter.createPayment).toHaveBeenCalledWith(
        orderId,
        mockOrder.total,
        'VND',
      );
    });

    it('should propagate error when MoMo adapter createPayment fails', async () => {
      const adapterError = new Error('MoMo gateway timeout');
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockMoMoAdapter.createPayment.mockRejectedValue(adapterError);

      await expect(
        service.createPayment(userId, orderId, PaymentMethod.MOMO),
      ).rejects.toThrow(adapterError);

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
      });
      expect(mockMoMoAdapter.createPayment).toHaveBeenCalledWith(
        orderId,
        mockOrder.total,
        'VND',
      );
    });

    it('should propagate error when prisma order.findUnique fails', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.order.findUnique.mockRejectedValue(dbError);

      await expect(
        service.createPayment(userId, orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow(dbError);

      expect(mockStripeAdapter.createPayment).not.toHaveBeenCalled();
      expect(mockMoMoAdapter.createPayment).not.toHaveBeenCalled();
    });
  });

  describe('verifyPayment', () => {
    const paymentId = 'pay-mock-123';

    const mockStripeVerification: PaymentVerification = {
      success: true,
      status: 'completed',
      transactionId: 'stripe_txn_123456789',
      message: 'Mock payment verification successful',
    };

    const mockMoMoVerification: PaymentVerification = {
      success: true,
      status: 'completed',
      transactionId: 'momo_txn_987654321',
      message: 'Mock MoMo payment verification successful',
    };

    it('should throw ServiceUnavailableException when NODE_ENV is production', async () => {
      mockConfigService.get.mockReturnValue('production');

      await expect(
        service.verifyPayment(paymentId, PaymentMethod.STRIPE),
      ).rejects.toThrow(ServiceUnavailableException);
      await expect(
        service.verifyPayment(paymentId, PaymentMethod.STRIPE),
      ).rejects.toThrow('Payment provider is not configured');

      expect(mockConfigService.get).toHaveBeenCalledWith('NODE_ENV');
      expect(mockStripeAdapter.verifyPayment).not.toHaveBeenCalled();
      expect(mockMoMoAdapter.verifyPayment).not.toHaveBeenCalled();
    });

    it('should successfully verify payment using Stripe adapter when method is STRIPE', async () => {
      mockStripeAdapter.verifyPayment.mockResolvedValue(mockStripeVerification);

      const result = await service.verifyPayment(
        paymentId,
        PaymentMethod.STRIPE,
      );

      expect(mockStripeAdapter.verifyPayment).toHaveBeenCalledWith(paymentId);
      expect(mockMoMoAdapter.verifyPayment).not.toHaveBeenCalled();
      expect(result).toEqual(mockStripeVerification);
    });

    it('should successfully verify payment using MoMo adapter when method is MOMO', async () => {
      mockMoMoAdapter.verifyPayment.mockResolvedValue(mockMoMoVerification);

      const result = await service.verifyPayment(paymentId, PaymentMethod.MOMO);

      expect(mockMoMoAdapter.verifyPayment).toHaveBeenCalledWith(paymentId);
      expect(mockStripeAdapter.verifyPayment).not.toHaveBeenCalled();
      expect(result).toEqual(mockMoMoVerification);
    });

    it('should propagate error when Stripe adapter verifyPayment fails', async () => {
      const adapterError = new Error('Stripe verify error: network error');
      mockStripeAdapter.verifyPayment.mockRejectedValue(adapterError);

      await expect(
        service.verifyPayment(paymentId, PaymentMethod.STRIPE),
      ).rejects.toThrow(adapterError);

      expect(mockStripeAdapter.verifyPayment).toHaveBeenCalledWith(paymentId);
    });

    it('should propagate error when MoMo adapter verifyPayment fails', async () => {
      const adapterError = new Error('MoMo verify error: signature mismatch');
      mockMoMoAdapter.verifyPayment.mockRejectedValue(adapterError);

      await expect(
        service.verifyPayment(paymentId, PaymentMethod.MOMO),
      ).rejects.toThrow(adapterError);

      expect(mockMoMoAdapter.verifyPayment).toHaveBeenCalledWith(paymentId);
    });
  });

  describe('processPaymentWebhook', () => {
    it('should throw UnauthorizedException with provider name for stripe', async () => {
      const payload = {
        id: 'evt_test_webhook',
        type: 'payment_intent.succeeded',
      };

      await expect(
        service.processPaymentWebhook('stripe', payload),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.processPaymentWebhook('stripe', payload),
      ).rejects.toThrow('Webhook verification is not configured for stripe');
    });

    it('should throw UnauthorizedException with provider name for momo', async () => {
      const payload = {
        partnerCode: 'MOMO',
        orderId: 'ORD-001',
        resultCode: 0,
      };

      await expect(
        service.processPaymentWebhook('momo', payload),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.processPaymentWebhook('momo', payload),
      ).rejects.toThrow('Webhook verification is not configured for momo');
    });

    it('should throw UnauthorizedException for unknown provider and null payload', async () => {
      await expect(
        service.processPaymentWebhook('unknown_provider', null),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.processPaymentWebhook('unknown_provider', null),
      ).rejects.toThrow(
        'Webhook verification is not configured for unknown_provider',
      );
    });
  });

  describe('refundPayment', () => {
    const orderId = 'order-789';
    const mockOrder = {
      id: orderId,
      code: 'ORD-2026-789',
      userId: 'user-123',
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.COMPLETED,
      total: 500000,
    };

    const mockStripeRefundResult: RefundResult = {
      success: true,
      refundId: 'stripe_refund_123456789',
      amount: 500000,
      message: 'Mock refund processed successfully',
    };

    const mockMoMoRefundResult: RefundResult = {
      success: true,
      refundId: 'momo_refund_987654321',
      amount: 500000,
      message: 'Mock MoMo refund processed successfully',
    };

    it('should throw ServiceUnavailableException when NODE_ENV is production', async () => {
      mockConfigService.get.mockReturnValue('production');

      await expect(
        service.refundPayment(orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow(ServiceUnavailableException);
      await expect(
        service.refundPayment(orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow('Payment provider is not configured');

      expect(mockConfigService.get).toHaveBeenCalledWith('NODE_ENV');
      expect(mockPrismaService.order.findUnique).not.toHaveBeenCalled();
      expect(mockStripeAdapter.refundPayment).not.toHaveBeenCalled();
      expect(mockMoMoAdapter.refundPayment).not.toHaveBeenCalled();
      expect(mockPrismaService.order.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when order is not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.refundPayment(orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.refundPayment(orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow('Order not found');

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
      });
      expect(mockStripeAdapter.refundPayment).not.toHaveBeenCalled();
      expect(mockMoMoAdapter.refundPayment).not.toHaveBeenCalled();
      expect(mockPrismaService.order.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when order paymentStatus is not COMPLETED', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.PENDING,
      });

      await expect(
        service.refundPayment(orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.refundPayment(orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow('Order has not been paid');

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
      });
      expect(mockStripeAdapter.refundPayment).not.toHaveBeenCalled();
      expect(mockMoMoAdapter.refundPayment).not.toHaveBeenCalled();
      expect(mockPrismaService.order.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when order status is not DELIVERED', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.SHIPPED,
      });

      await expect(
        service.refundPayment(orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.refundPayment(orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow('Order has not been delivered');

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
      });
      expect(mockStripeAdapter.refundPayment).not.toHaveBeenCalled();
      expect(mockMoMoAdapter.refundPayment).not.toHaveBeenCalled();
      expect(mockPrismaService.order.update).not.toHaveBeenCalled();
    });

    it('should successfully refund payment using Stripe adapter and update order status to REFUNDED', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockStripeAdapter.refundPayment.mockResolvedValue(mockStripeRefundResult);
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.REFUNDED,
        status: OrderStatus.REFUNDED,
      });

      const result = await service.refundPayment(
        orderId,
        PaymentMethod.STRIPE,
      );

      const expectedPaymentId = `stripe_payment_${mockOrder.id}`;
      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
      });
      expect(mockStripeAdapter.refundPayment).toHaveBeenCalledWith(
        expectedPaymentId,
        mockOrder.total,
      );
      expect(mockMoMoAdapter.refundPayment).not.toHaveBeenCalled();
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          status: OrderStatus.REFUNDED,
        },
      });
      expect(result).toEqual(mockStripeRefundResult);
    });

    it('should successfully refund payment using MoMo adapter and update order status to REFUNDED', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockMoMoAdapter.refundPayment.mockResolvedValue(mockMoMoRefundResult);
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.REFUNDED,
        status: OrderStatus.REFUNDED,
      });

      const result = await service.refundPayment(orderId, PaymentMethod.MOMO);

      const expectedPaymentId = `momo_payment_${mockOrder.id}`;
      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
      });
      expect(mockMoMoAdapter.refundPayment).toHaveBeenCalledWith(
        expectedPaymentId,
        mockOrder.total,
      );
      expect(mockStripeAdapter.refundPayment).not.toHaveBeenCalled();
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          status: OrderStatus.REFUNDED,
        },
      });
      expect(result).toEqual(mockMoMoRefundResult);
    });

    it('should propagate error and not update order when Stripe adapter refundPayment fails', async () => {
      const adapterError = new Error('Stripe refund declined by bank');
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockStripeAdapter.refundPayment.mockRejectedValue(adapterError);

      await expect(
        service.refundPayment(orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow(adapterError);

      const expectedPaymentId = `stripe_payment_${mockOrder.id}`;
      expect(mockStripeAdapter.refundPayment).toHaveBeenCalledWith(
        expectedPaymentId,
        mockOrder.total,
      );
      expect(mockPrismaService.order.update).not.toHaveBeenCalled();
    });

    it('should propagate error and not update order when MoMo adapter refundPayment fails', async () => {
      const adapterError = new Error('MoMo refund transaction failed');
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockMoMoAdapter.refundPayment.mockRejectedValue(adapterError);

      await expect(
        service.refundPayment(orderId, PaymentMethod.MOMO),
      ).rejects.toThrow(adapterError);

      const expectedPaymentId = `momo_payment_${mockOrder.id}`;
      expect(mockMoMoAdapter.refundPayment).toHaveBeenCalledWith(
        expectedPaymentId,
        mockOrder.total,
      );
      expect(mockPrismaService.order.update).not.toHaveBeenCalled();
    });

    it('should propagate error when prisma order.findUnique fails', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.order.findUnique.mockRejectedValue(dbError);

      await expect(
        service.refundPayment(orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow(dbError);

      expect(mockStripeAdapter.refundPayment).not.toHaveBeenCalled();
      expect(mockMoMoAdapter.refundPayment).not.toHaveBeenCalled();
      expect(mockPrismaService.order.update).not.toHaveBeenCalled();
    });

    it('should propagate error when prisma order.update fails after successful refund', async () => {
      const dbError = new Error('Database update failed');
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockStripeAdapter.refundPayment.mockResolvedValue(mockStripeRefundResult);
      mockPrismaService.order.update.mockRejectedValue(dbError);

      await expect(
        service.refundPayment(orderId, PaymentMethod.STRIPE),
      ).rejects.toThrow(dbError);

      const expectedPaymentId = `stripe_payment_${mockOrder.id}`;
      expect(mockStripeAdapter.refundPayment).toHaveBeenCalledWith(
        expectedPaymentId,
        mockOrder.total,
      );
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          status: OrderStatus.REFUNDED,
        },
      });
    });
  });
});
