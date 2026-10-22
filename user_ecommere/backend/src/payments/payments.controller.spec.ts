import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CsrfGuard } from '@/common/guards/csrf.guard';
import { CreatePaymentDto, PaymentMethod } from './dtos/create-payment.dto';
import { VerifyPaymentDto } from './dtos/verify-payment.dto';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: PaymentsService;

  const canActivateStub = jest.fn(() => true);

  const mockPaymentsService = {
    createPayment: jest.fn(),
    verifyPayment: jest.fn(),
    processPaymentWebhook: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: canActivateStub })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: canActivateStub })
      .overrideGuard(CsrfGuard)
      .useValue({ canActivate: canActivateStub })
      .compile();

    controller = module.get<PaymentsController>(PaymentsController);
    paymentsService = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Guards', () => {
    it('should override route guards with canActivate stub returning true', () => {
      expect(canActivateStub()).toBe(true);
    });
  });

  describe('createPayment', () => {
    it('should delegate to paymentsService.createPayment with userId, orderId, and method (STRIPE)', async () => {
      const userId = 'user-123';
      const dto: CreatePaymentDto = {
        orderId: 'order-1',
        method: PaymentMethod.STRIPE,
      };
      const mockResponse = {
        paymentId: 'pi_test_123',
        clientSecret: 'secret_123',
        order: { id: 'order-1', code: 'ORD001', total: 50000 },
      };
      mockPaymentsService.createPayment.mockResolvedValue(mockResponse);

      const result = await controller.createPayment(userId, dto);

      expect(paymentsService.createPayment).toHaveBeenCalledWith(
        userId,
        'order-1',
        PaymentMethod.STRIPE,
      );
      expect(paymentsService.createPayment).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockResponse);
    });

    it('should delegate to paymentsService.createPayment with userId, orderId, and method (MOMO)', async () => {
      const userId = 'user-123';
      const dto: CreatePaymentDto = {
        orderId: 'order-2',
        method: PaymentMethod.MOMO,
      };
      const mockResponse = {
        paymentId: 'momo_test_456',
        payUrl: 'https://test-payment.momo.vn',
        order: { id: 'order-2', code: 'ORD002', total: 100000 },
      };
      mockPaymentsService.createPayment.mockResolvedValue(mockResponse);

      const result = await controller.createPayment(userId, dto);

      expect(paymentsService.createPayment).toHaveBeenCalledWith(
        userId,
        'order-2',
        PaymentMethod.MOMO,
      );
      expect(paymentsService.createPayment).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockResponse);
    });

    it('should propagate errors from paymentsService.createPayment', async () => {
      const userId = 'user-123';
      const dto: CreatePaymentDto = {
        orderId: 'order-nonexistent',
        method: PaymentMethod.STRIPE,
      };
      const error = new NotFoundException('Order not found');
      mockPaymentsService.createPayment.mockRejectedValue(error);

      await expect(controller.createPayment(userId, dto)).rejects.toThrow(
        error,
      );
      expect(paymentsService.createPayment).toHaveBeenCalledWith(
        userId,
        'order-nonexistent',
        PaymentMethod.STRIPE,
      );
    });
  });

  describe('verifyPayment', () => {
    it('should delegate to paymentsService.verifyPayment with paymentId and method (STRIPE)', async () => {
      const dto: VerifyPaymentDto = {
        paymentId: 'pi_test_123',
        method: PaymentMethod.STRIPE,
      };
      const mockVerification = {
        success: true,
        status: 'COMPLETED',
        paymentId: 'pi_test_123',
      };
      mockPaymentsService.verifyPayment.mockResolvedValue(mockVerification);

      const result = await controller.verifyPayment(dto);

      expect(paymentsService.verifyPayment).toHaveBeenCalledWith(
        'pi_test_123',
        PaymentMethod.STRIPE,
      );
      expect(paymentsService.verifyPayment).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockVerification);
    });

    it('should delegate to paymentsService.verifyPayment with paymentId and method (MOMO)', async () => {
      const dto: VerifyPaymentDto = {
        paymentId: 'momo_test_456',
        method: PaymentMethod.MOMO,
      };
      const mockVerification = {
        success: true,
        status: 'COMPLETED',
        paymentId: 'momo_test_456',
      };
      mockPaymentsService.verifyPayment.mockResolvedValue(mockVerification);

      const result = await controller.verifyPayment(dto);

      expect(paymentsService.verifyPayment).toHaveBeenCalledWith(
        'momo_test_456',
        PaymentMethod.MOMO,
      );
      expect(paymentsService.verifyPayment).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockVerification);
    });

    it('should propagate errors from paymentsService.verifyPayment', async () => {
      const dto: VerifyPaymentDto = {
        paymentId: 'bad_payment_id',
        method: PaymentMethod.STRIPE,
      };
      const error = new BadRequestException('Verification failed');
      mockPaymentsService.verifyPayment.mockRejectedValue(error);

      await expect(controller.verifyPayment(dto)).rejects.toThrow(error);
      expect(paymentsService.verifyPayment).toHaveBeenCalledWith(
        'bad_payment_id',
        PaymentMethod.STRIPE,
      );
    });
  });

  describe('stripeWebhook', () => {
    it('should delegate to paymentsService.processPaymentWebhook with provider "stripe" and payload', async () => {
      const payload = {
        id: 'evt_stripe_test',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test_123' } },
      };
      const mockResult = { received: true };
      mockPaymentsService.processPaymentWebhook.mockResolvedValue(mockResult);

      const result = await controller.stripeWebhook(payload);

      expect(paymentsService.processPaymentWebhook).toHaveBeenCalledWith(
        'stripe',
        payload,
      );
      expect(paymentsService.processPaymentWebhook).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockResult);
    });

    it('should propagate errors from paymentsService.processPaymentWebhook for stripe', async () => {
      const payload = { invalid: true };
      const error = new UnauthorizedException(
        'Webhook verification is not configured for stripe',
      );
      mockPaymentsService.processPaymentWebhook.mockRejectedValue(error);

      await expect(controller.stripeWebhook(payload)).rejects.toThrow(error);
      expect(paymentsService.processPaymentWebhook).toHaveBeenCalledWith(
        'stripe',
        payload,
      );
    });
  });

  describe('momoWebhook', () => {
    it('should delegate to paymentsService.processPaymentWebhook with provider "momo" and payload', async () => {
      const payload = {
        partnerCode: 'MOMO',
        orderId: 'ord_123',
        resultCode: 0,
        message: 'Successful',
      };
      const mockResult = { message: 'Success' };
      mockPaymentsService.processPaymentWebhook.mockResolvedValue(mockResult);

      const result = await controller.momoWebhook(payload);

      expect(paymentsService.processPaymentWebhook).toHaveBeenCalledWith(
        'momo',
        payload,
      );
      expect(paymentsService.processPaymentWebhook).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockResult);
    });

    it('should propagate errors from paymentsService.processPaymentWebhook for momo', async () => {
      const payload = { partnerCode: 'MOMO', resultCode: 99 };
      const error = new UnauthorizedException(
        'Webhook verification is not configured for momo',
      );
      mockPaymentsService.processPaymentWebhook.mockRejectedValue(error);

      await expect(controller.momoWebhook(payload)).rejects.toThrow(error);
      expect(paymentsService.processPaymentWebhook).toHaveBeenCalledWith(
        'momo',
        payload,
      );
    });
  });
});
