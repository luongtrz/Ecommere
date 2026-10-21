import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { MoMoAdapter } from './momo.adapter';

describe('MoMoAdapter', () => {
  let adapter: MoMoAdapter;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    loggerSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [MoMoAdapter],
    }).compile();

    adapter = module.get<MoMoAdapter>(MoMoAdapter);
  });

  afterEach(() => {
    loggerSpy.mockRestore();
  });

  it('should be defined when instantiated via TestingModule', () => {
    expect(adapter).toBeDefined();
  });

  it('can be directly instantiated with constructor', () => {
    const directAdapter = new MoMoAdapter();
    expect(directAdapter).toBeDefined();
    expect(directAdapter).toBeInstanceOf(MoMoAdapter);
  });

  describe('getName', () => {
    it('should return MoMo', () => {
      expect(adapter.getName()).toBe('MoMo');
    });
  });

  describe('createPayment', () => {
    it('should log mock messages and return payment result with correct structure', async () => {
      const orderId = 'order-test-123';
      const amount = 350000;
      const currency = 'VND';

      const result = await adapter.createPayment(orderId, amount, currency);

      expect(loggerSpy).toHaveBeenCalledWith(
        `[MOCK] Creating MoMo payment for order ${orderId}`,
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        `[MOCK] Amount: ${amount} ${currency}`,
      );

      expect(result.success).toBe(true);
      expect(typeof result.paymentId).toBe('string');
      expect(result.paymentId).toMatch(/^momo_\d+_[a-z0-9]+$/);
      expect(result.paymentUrl).toBe(
        `https://payment.momo.vn/mock/${result.paymentId}`,
      );
      expect(result.qrCode).toBe(
        `https://api.qrserver.com/v1/create-qr-code/?data=MOMO_${result.paymentId}&size=300x300`,
      );
      expect(result.message).toBe(
        'Mock MoMo payment created. In production, this would return a real MoMo payment request.',
      );
      expect(result.metadata).toEqual({
        provider: 'momo',
        orderId,
        amount,
        currency,
      });
    });

    it('should generate distinct payment IDs across successive calls', async () => {
      const result1 = await adapter.createPayment('order-1', 100000, 'VND');
      const result2 = await adapter.createPayment('order-2', 200000, 'VND');

      expect(result1.paymentId).not.toBe(result2.paymentId);
    });
  });

  describe('verifyPayment', () => {
    it('should log verification and return completed payment verification result', async () => {
      const paymentId = 'momo_mock_pay_123';

      const result = await adapter.verifyPayment(paymentId);

      expect(loggerSpy).toHaveBeenCalledWith(
        `[MOCK] Verifying MoMo payment ${paymentId}`,
      );
      expect(result.success).toBe(true);
      expect(result.status).toBe('completed');
      expect(typeof result.transactionId).toBe('string');
      expect(result.transactionId).toMatch(/^momo_txn_\d+$/);
      expect(result.message).toBe('Mock MoMo payment verification successful');
    });
  });

  describe('refundPayment', () => {
    it('should log refund and return refund result with correct amount', async () => {
      const paymentId = 'momo_mock_pay_456';
      const amount = 500000;

      const result = await adapter.refundPayment(paymentId, amount);

      expect(loggerSpy).toHaveBeenCalledWith(
        `[MOCK] Refunding MoMo payment ${paymentId}, amount: ${amount}`,
      );
      expect(result.success).toBe(true);
      expect(typeof result.refundId).toBe('string');
      expect(result.refundId).toMatch(/^momo_refund_\d+$/);
      expect(result.amount).toBe(amount);
      expect(result.message).toBe('Mock MoMo refund processed successfully');
    });
  });
});
