export interface PaymentProvider {
  getName(): string;
  createPayment(orderId: string, amount: number, currency: string): Promise<PaymentResult>;
  verifyPayment(paymentId: string): Promise<PaymentVerification>;
  refundPayment(paymentId: string, amount: number): Promise<RefundResult>;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  paymentUrl?: string;
  qrCode?: string;
  message?: string;
  metadata?: any;
}

export interface PaymentVerification {
  success: boolean;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount?: number;
  transactionId?: string;
  message?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  message?: string;
}
