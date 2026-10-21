import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { StripeAdapter } from './stripe.adapter';

describe('StripeAdapter', () => {
  let adapter: StripeAdapter;
  let loggerLogSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();
    loggerLogSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [StripeAdapter],
    }).compile();

    adapter = module.get<StripeAdapter>(StripeAdapter);
  });

  afterEach(() => {
    loggerLogSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('can be instantiated directly via constructor', () => {
    const directAdapter = new StripeAdapter();
    expect(directAdapter).toBeDefined();
    expect(directAdapter.getName()).toBe('Stripe');
  });

  describe('getName', () => {
    it('should return "Stripe"', () => {
      const name = adapter.getName();
      expect(name).toBe('Stripe');
    });
  });

  describe('createPayment', () => {
    it('should create mock Stripe payment with expected structure and metadata', async () => {
      const orderId = 'order-123';
      const amount = 500000;
      const currency = 'VND';

      const result = await adapter.createPayment(orderId, amount, currency);

      expect(result.success).toBe(true);
      expect(typeof result.paymentId).toBe('string');
      expect(result.paymentId.startsWith('stripe_')).toBe(true);
      expect(result.paymentUrl).toBe(
        `https://checkout.stripe.com/pay/mock_${result.paymentId}`,
      );
      expect(result.message).toBe(
        'Mock Stripe payment created. In production, this would return a real Stripe payment intent.',
      );
      expect(result.metadata).toEqual({
        provider: 'stripe',
        orderId,
        amount,
        currency,
      });

      expect(loggerLogSpy).toHaveBeenCalledWith(
        `[MOCK] Creating Stripe payment for order ${orderId}`,
      );
      expect(loggerLogSpy).toHaveBeenCalledWith(
        `[MOCK] Amount: ${amount} ${currency}`,
      );
    });

    it('should handle different amounts, currencies, and orderIds', async () => {
      const orderId = 'order-999';
      const amount = 49.99;
      const currency = 'USD';

      const result = await adapter.createPayment(orderId, amount, currency);

      expect(result.success).toBe(true);
      expect(result.paymentId).toMatch(/^stripe_\d+_[a-z0-9]+$/);
      expect(result.paymentUrl).toBe(
        `https://checkout.stripe.com/pay/mock_${result.paymentId}`,
      );
      expect(result.metadata).toEqual({
        provider: 'stripe',
        orderId,
        amount,
        currency,
      });
      expect(loggerLogSpy).toHaveBeenCalledWith(
        `[MOCK] Creating Stripe payment for order ${orderId}`,
      );
      expect(loggerLogSpy).toHaveBeenCalledWith(
        `[MOCK] Amount: ${amount} ${currency}`,
      );
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment and return completed status with transaction id', async () => {
      const paymentId = 'stripe_1234567890_abc123def';

      const result = await adapter.verifyPayment(paymentId);

      expect(result.success).toBe(true);
      expect(result.status).toBe('completed');
      expect(typeof result.transactionId).toBe('string');
      expect(result.transactionId!.startsWith('stripe_txn_')).toBe(true);
      expect(result.message).toBe('Mock payment verification successful');

      expect(loggerLogSpy).toHaveBeenCalledWith(
        `[MOCK] Verifying Stripe payment ${paymentId}`,
      );
    });
  });

  describe('refundPayment', () => {
    it('should refund payment and return refund details', async () => {
      const paymentId = 'stripe_1234567890_abc123def';
      const amount = 250000;

      const result = await adapter.refundPayment(paymentId, amount);

      expect(result.success).toBe(true);
      expect(typeof result.refundId).toBe('string');
      expect(result.refundId.startsWith('stripe_refund_')).toBe(true);
      expect(result.amount).toBe(amount);
      expect(result.message).toBe('Mock refund processed successfully');

      expect(loggerLogSpy).toHaveBeenCalledWith(
        `[MOCK] Refunding Stripe payment ${paymentId}, amount: ${amount}`,
      );
    });
  });
});
