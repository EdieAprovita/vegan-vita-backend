import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { OrdersService } from '../orders/orders.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!secretKey) {
      this.logger.error('❌ STRIPE_SECRET_KEY no está configurado');
      this.logger.error('📚 Lee docs/STRIPE_SETUP.md para configurar Stripe');
      throw new Error(
        'STRIPE_SECRET_KEY is required. Please check docs/STRIPE_SETUP.md',
      );
    }

    if (!webhookSecret) {
      this.logger.warn('⚠️  STRIPE_WEBHOOK_SECRET no está configurado');
      this.logger.warn('⚠️  Los webhooks no funcionarán correctamente');
      this.logger.warn('📚 Lee docs/STRIPE_SETUP.md para configurar webhooks');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-10-28.acacia' as any, // Versión oficial más reciente
    });

    this.logger.log('✅ Stripe inicializado correctamente');
  }

  async createPaymentIntent(userId: string, createDto: CreatePaymentIntentDto) {
    try {
      const order = await this.ordersService.findOne(createDto.orderId, {
        id: userId,
      } as any);

      if (!order) {
        throw new NotFoundException('Orden no encontrada');
      }

      if (order.isPaid) {
        throw new BadRequestException('Esta orden ya fue pagada');
      }

      // Validar que el monto sea válido
      const amount = Math.round(Number(order.totalPrice) * 100);
      if (amount < 50) {
        // Mínimo $0.50 USD
        throw new BadRequestException('El monto mínimo es $0.50 USD');
      }

      // Crear PaymentIntent con configuración mejorada
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          orderId: order.id,
          userId: userId,
        },
        description: `Pago para orden #${order.id}`,
        receipt_email: order.user.email,
      });

      this.logger.log(
        `PaymentIntent creado: ${paymentIntent.id} para orden: ${order.id}`,
      );

      return {
        clientSecret: paymentIntent.client_secret,
        orderId: order.id,
        amount: order.totalPrice,
        currency: 'usd',
      };
    } catch (error) {
      this.logger.error('Error creando PaymentIntent:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error procesando el pago');
    }
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!signature) {
      this.logger.warn('Webhook recibido sin signature');
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
      this.logger.log(`Webhook recibido: ${event.type} (${event.id})`);
    } catch (err) {
      this.logger.error('Error verificando webhook signature:', err);
      throw new BadRequestException('Webhook signature verification failed');
    }

    // Manejar eventos con mejor logging y manejo de errores
    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          const orderId = paymentIntent.metadata.orderId;

          if (orderId) {
            await this.ordersService.markAsPaid(orderId, paymentIntent.id);
            this.logger.log(`Orden ${orderId} marcada como pagada`);
          } else {
            this.logger.warn(
              `PaymentIntent ${paymentIntent.id} sin orderId en metadata`,
            );
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          this.logger.error(`Pago fallido: ${paymentIntent.id}`, {
            orderId: paymentIntent.metadata.orderId,
            failure_code: paymentIntent.last_payment_error?.code,
            failure_message: paymentIntent.last_payment_error?.message,
          });
          break;
        }

        case 'payment_intent.canceled': {
          const paymentIntent = event.data.object;
          this.logger.warn(`PaymentIntent cancelado: ${paymentIntent.id}`);
          break;
        }

        default:
          this.logger.log(`Evento no manejado: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error procesando webhook ${event.type}:`, error);
      // No lanzamos error para evitar que Stripe reintente el webhook
    }

    return { received: true };
  }

  getPublishableKey() {
    const publishableKey = this.configService.get<string>(
      'STRIPE_PUBLISHABLE_KEY',
    );

    if (!publishableKey) {
      this.logger.error('STRIPE_PUBLISHABLE_KEY no configurado');
      throw new InternalServerErrorException(
        'Configuración de Stripe incompleta',
      );
    }

    return {
      publishableKey,
    };
  }
}
