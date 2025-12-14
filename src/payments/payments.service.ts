import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { PaymentIntentResponseDto } from './dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly processedEvents = new Set<string>();

  constructor(
    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}

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
      try {
        const existingIntent = await this.stripe.paymentIntents.retrieve(
          order.stripePaymentIntentId,
        );

        if (existingIntent.status === 'succeeded') {
          throw new BadRequestException('This order has already been paid');
        }

        // Return existing payment intent
        return {
          clientSecret: existingIntent.client_secret as string,
          paymentIntentId: existingIntent.id,
          amount: existingIntent.amount,
          currency: existingIntent.currency,
          status: existingIntent.status,
        };
      } catch (error) {
        // If payment intent doesn't exist in Stripe, continue to create new one
        this.logger.warn(
          `Payment intent ${order.stripePaymentIntentId} not found in Stripe, creating new one`,
        );
      }
    }

    // Convert totalPrice to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(Number(order.totalPrice) * 100);

    if (amountInCents < 50) {
      throw new BadRequestException(
        'Minimum payment amount is $0.50 USD or equivalent',
      );
    }

    try {
      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: {
          orderId: order.id,
          userId: userId,
        },
        description: `Payment for order #${order.id}`,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Update order with payment intent ID
      await this.ordersService.updatePaymentStatus(order.id, {
        stripePaymentIntentId: paymentIntent.id,
        stripePaymentStatus: paymentIntent.status,
      });

      this.logger.log(
        `Payment intent created: ${paymentIntent.id} for order: ${order.id}`,
      );

      return {
        clientSecret: paymentIntent.client_secret as string,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create payment intent: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Error creating payment intent: ${error.message}`,
      );
    }
  }

  async getPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to retrieve payment intent: ${error.message}`);
      throw new NotFoundException('Payment intent not found');
    }
  }

  async cancelPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.cancel(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to cancel payment intent: ${error.message}`);
      throw new BadRequestException(
        `Error canceling payment: ${error.message}`,
      );
    }
  }

  async handleWebhookEvent(signature: string, payload: Buffer): Promise<void> {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (error) {
      this.logger.error(
        `Webhook signature verification failed: ${error.message}`,
      );
      throw new BadRequestException(
        `Webhook signature verification failed: ${error.message}`,
      );
    }

    // Idempotency check
    if (this.processedEvents.has(event.id)) {
      this.logger.warn(`Event ${event.id} already processed, skipping`);
      return;
    }

    this.logger.log(`Processing webhook event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      // Mark event as processed
      this.processedEvents.add(event.id);
    } catch (error) {
      this.logger.error(
        `Error processing webhook event ${event.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const orderId = paymentIntent.metadata?.orderId;

    if (!orderId) {
      this.logger.warn(
        `Payment intent ${paymentIntent.id} missing orderId in metadata`,
      );
      return;
    }

    try {
      await this.ordersService.updatePaymentStatus(orderId, {
        stripePaymentIntentId: paymentIntent.id,
        stripePaymentStatus: paymentIntent.status,
        isPaid: true,
        paidAt: new Date(),
      });

      this.logger.log(
        `Order ${orderId} marked as paid via payment intent ${paymentIntent.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update order ${orderId} payment status: ${error.message}`,
      );
      throw error;
    }
  }

  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const orderId = paymentIntent.metadata?.orderId;

    if (!orderId) {
      this.logger.warn(
        `Payment intent ${paymentIntent.id} missing orderId in metadata`,
      );
      return;
    }

    try {
      await this.ordersService.updatePaymentStatus(orderId, {
        stripePaymentIntentId: paymentIntent.id,
        stripePaymentStatus: paymentIntent.status,
        isPaid: false,
      });

      this.logger.log(
        `Order ${orderId} payment failed for payment intent ${paymentIntent.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update order ${orderId} payment status: ${error.message}`,
      );
      throw error;
    }
  }

  private async handlePaymentIntentCanceled(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const orderId = paymentIntent.metadata?.orderId;

    if (!orderId) {
      this.logger.warn(
        `Payment intent ${paymentIntent.id} missing orderId in metadata`,
      );
      return;
    }

    try {
      const order = await this.ordersService.findOne(orderId);

      // Only cancel if order is still pending
      if (order.status === OrderStatus.PENDING) {
        await this.ordersService.updateStatus(orderId, {
          status: OrderStatus.CANCELLED,
        });

        this.logger.log(
          `Order ${orderId} cancelled due to payment intent cancellation`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to cancel order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    const paymentIntentId = charge.payment_intent as string;

    if (!paymentIntentId) {
      this.logger.warn(`Charge ${charge.id} missing payment_intent`);
      return;
    }

    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);
      const orderId = paymentIntent.metadata?.orderId;

      if (!orderId) {
        this.logger.warn(
          `Payment intent ${paymentIntentId} missing orderId in metadata`,
        );
        return;
      }

      await this.ordersService.updatePaymentStatus(orderId, {
        stripePaymentIntentId: paymentIntentId,
        stripePaymentStatus: paymentIntent.status,
        isRefunded: true,
      });

      this.logger.log(`Order ${orderId} marked as refunded`);
    } catch (error) {
      this.logger.error(
        `Failed to update order refund status: ${error.message}`,
      );
      throw error;
    }
  }
}
