import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { PaymentIntentResponseDto } from './dto';
import { IPaymentsService } from './interfaces/payment-service.interface';
import { randomUUID } from 'crypto';

export interface MockPaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'processing' | 'succeeded' | 'canceled';
  metadata: {
    orderId: string;
    userId: string;
  };
  createdAt: Date;
}

@Injectable()
export class PaymentsMockService implements IPaymentsService {
  private readonly logger = new Logger(PaymentsMockService.name);
  private readonly mockPaymentIntents = new Map<string, MockPaymentIntent>();

  constructor(private readonly ordersService: OrdersService) {
    this.logger.warn('⚠️ PaymentsMockService initialized - DUMMY MODE ACTIVE');
    this.logger.warn(
      '⚠️ Do NOT use in production! Use PAYMENTS_MODE=stripe for real payments',
    );
  }

  async createPaymentIntent(
    orderId: string,
    userId: string,
  ): Promise<PaymentIntentResponseDto> {
    // Get order and validate ownership
    const order = await this.ordersService.findOne(orderId);

    if (order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to pay this order');
    }

    // Check if order is already paid
    if (order.isPaid) {
      throw new BadRequestException('This order has already been paid');
    }

    // Check if order is cancelled
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot pay a cancelled order');
    }

    // Check if payment intent already exists
    if (order.stripePaymentIntentId) {
      const existingIntent = this.mockPaymentIntents.get(
        order.stripePaymentIntentId,
      );
      if (existingIntent) {
        if (existingIntent.status === 'succeeded') {
          throw new BadRequestException('This order has already been paid');
        }

        return {
          clientSecret: existingIntent.clientSecret,
          paymentIntentId: existingIntent.id,
          amount: existingIntent.amount,
          currency: existingIntent.currency,
          status: existingIntent.status,
        };
      }
    }

    // Convert totalPrice to cents
    const amountInCents = Math.round(Number(order.totalPrice) * 100);

    if (amountInCents < 50) {
      throw new BadRequestException(
        'Minimum payment amount is $0.50 USD or equivalent',
      );
    }

    // Create mock payment intent
    const paymentIntentId = `pi_mock_${randomUUID().replace(/-/g, '')}`;
    const clientSecret = `${paymentIntentId}_secret_${randomUUID().replace(/-/g, '')}`;

    const mockPaymentIntent: MockPaymentIntent = {
      id: paymentIntentId,
      clientSecret,
      amount: amountInCents,
      currency: 'usd',
      status: 'requires_payment_method',
      metadata: {
        orderId: order.id,
        userId: userId,
      },
      createdAt: new Date(),
    };

    this.mockPaymentIntents.set(paymentIntentId, mockPaymentIntent);

    // Update order with payment intent ID
    await this.ordersService.updatePaymentStatus(order.id, {
      stripePaymentIntentId: paymentIntentId,
      stripePaymentStatus: mockPaymentIntent.status,
    });

    this.logger.log(
      `[MOCK] Payment intent created: ${paymentIntentId} for order: ${order.id}`,
    );

    return {
      clientSecret: mockPaymentIntent.clientSecret,
      paymentIntentId: mockPaymentIntent.id,
      amount: mockPaymentIntent.amount,
      currency: mockPaymentIntent.currency,
      status: mockPaymentIntent.status,
    };
  }

  async getPaymentIntent(paymentIntentId: string): Promise<MockPaymentIntent> {
    const paymentIntent = this.mockPaymentIntents.get(paymentIntentId);

    if (!paymentIntent) {
      throw new NotFoundException('Payment intent not found');
    }

    return paymentIntent;
  }

  async cancelPaymentIntent(
    paymentIntentId: string,
  ): Promise<MockPaymentIntent> {
    const paymentIntent = this.mockPaymentIntents.get(paymentIntentId);

    if (!paymentIntent) {
      throw new NotFoundException('Payment intent not found');
    }

    if (paymentIntent.status === 'succeeded') {
      throw new BadRequestException(
        'Cannot cancel an already processed payment',
      );
    }

    paymentIntent.status = 'canceled';
    this.mockPaymentIntents.set(paymentIntentId, paymentIntent);

    this.logger.log(`[MOCK] Payment intent canceled: ${paymentIntentId}`);

    return paymentIntent;
  }

  /**
   * SIMULATE SUCCESS - Only available in dummy mode
   * Simulates a successful payment for testing
   */
  async simulatePaymentSuccess(
    orderId: string,
  ): Promise<{ success: boolean; message: string; order: any }> {
    const order = await this.ordersService.findOne(orderId);

    if (order.isPaid) {
      throw new BadRequestException('This order is already paid');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot pay a cancelled order');
    }

    // Update mock payment intent if exists
    if (order.stripePaymentIntentId) {
      const paymentIntent = this.mockPaymentIntents.get(
        order.stripePaymentIntentId,
      );
      if (paymentIntent) {
        paymentIntent.status = 'succeeded';
        this.mockPaymentIntents.set(order.stripePaymentIntentId, paymentIntent);
      }
    }

    // Mark order as paid
    await this.ordersService.updatePaymentStatus(order.id, {
      stripePaymentIntentId:
        order.stripePaymentIntentId ||
        `pi_simulated_${randomUUID().replace(/-/g, '')}`,
      stripePaymentStatus: 'succeeded',
      isPaid: true,
      paidAt: new Date(),
    });

    const updatedOrder = await this.ordersService.findOne(orderId);

    this.logger.log(`[MOCK] Payment simulated SUCCESS for order: ${orderId}`);

    return {
      success: true,
      message: `[MOCK] Payment simulated successfully for order ${orderId}`,
      order: updatedOrder,
    };
  }

  /**
   * SIMULATE FAILURE - Only available in dummy mode
   * Simulates a failed payment for testing
   */
  async simulatePaymentFailure(
    orderId: string,
    reason?: string,
  ): Promise<{ success: boolean; message: string; order: any }> {
    const order = await this.ordersService.findOne(orderId);

    if (order.isPaid) {
      throw new BadRequestException('This order is already paid');
    }

    // Update mock payment intent if exists
    if (order.stripePaymentIntentId) {
      const paymentIntent = this.mockPaymentIntents.get(
        order.stripePaymentIntentId,
      );
      if (paymentIntent) {
        paymentIntent.status = 'canceled';
        this.mockPaymentIntents.set(order.stripePaymentIntentId, paymentIntent);
      }
    }

    // Generate payment intent ID if not exists
    const paymentIntentId =
      order.stripePaymentIntentId ||
      `pi_failed_${randomUUID().replace(/-/g, '')}`;

    // Update order payment status
    await this.ordersService.updatePaymentStatus(order.id, {
      stripePaymentIntentId: paymentIntentId,
      stripePaymentStatus: 'failed',
      isPaid: false,
    });

    const updatedOrder = await this.ordersService.findOne(orderId);

    this.logger.log(
      `[MOCK] Payment simulated FAILURE for order: ${orderId}. Reason: ${reason || 'Simulated failure'}`,
    );

    return {
      success: true,
      message: `[MOCK] Failed payment simulated for order ${orderId}. Reason: ${reason || 'Simulated failure'}`,
      order: updatedOrder,
    };
  }

  /**
   * SIMULATE REFUND - Only available in dummy mode
   * Simulates a refund for testing
   */
  async simulateRefund(
    orderId: string,
  ): Promise<{ success: boolean; message: string; order: any }> {
    const order = await this.ordersService.findOne(orderId);

    if (!order.isPaid) {
      throw new BadRequestException(
        'Cannot refund an unpaid order',
      );
    }

    // Generate payment intent ID if not exists
    const paymentIntentId =
      order.stripePaymentIntentId ||
      `pi_refunded_${randomUUID().replace(/-/g, '')}`;

    // Update order as refunded
    await this.ordersService.updatePaymentStatus(order.id, {
      stripePaymentIntentId: paymentIntentId,
      stripePaymentStatus: 'refunded',
      isRefunded: true,
    });

    const updatedOrder = await this.ordersService.findOne(orderId);

    this.logger.log(`[MOCK] Refund simulated for order: ${orderId}`);

    return {
      success: true,
      message: `[MOCK] Refund simulated successfully for order ${orderId}`,
      order: updatedOrder,
    };
  }

  /**
   * Get all mock payment intents - For debugging in dummy mode
   */
  getAllMockPaymentIntents(): MockPaymentIntent[] {
    return Array.from(this.mockPaymentIntents.values());
  }

  /**
   * Clear all mock payment intents - For testing cleanup
   */
  clearAllMockPaymentIntents(): void {
    this.mockPaymentIntents.clear();
    this.logger.log('[MOCK] All payment intents cleared');
  }
}
