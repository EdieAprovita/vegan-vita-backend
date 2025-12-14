import { PaymentIntentResponseDto } from '../dto';

export interface UpdatePaymentStatusParams {
  stripePaymentIntentId?: string;
  stripePaymentStatus?: string;
  isPaid?: boolean;
  paidAt?: Date;
  isRefunded?: boolean;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
}

export interface IPaymentsService {
  createPaymentIntent(
    orderId: string,
    userId: string,
  ): Promise<PaymentIntentResponseDto>;

  getPaymentIntent(paymentIntentId: string): Promise<any>;

  cancelPaymentIntent(paymentIntentId: string): Promise<any>;
}

export const PAYMENTS_SERVICE = 'PAYMENTS_SERVICE';
