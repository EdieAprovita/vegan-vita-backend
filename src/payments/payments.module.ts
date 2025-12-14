import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsMockService } from './payments-mock.service';
import { OrdersModule } from '../orders/orders.module';
import { OrdersService } from '../orders/orders.service';
import { PAYMENTS_SERVICE } from './interfaces/payment-service.interface';
import Stripe from 'stripe';

const logger = new Logger('PaymentsModule');

@Module({
  imports: [ConfigModule, OrdersModule],
  controllers: [PaymentsController],
  providers: [
    // Factory to provide correct payments service based on PAYMENTS_MODE
    {
      provide: PAYMENTS_SERVICE,
      inject: [ConfigService, OrdersService],
      useFactory: (configService: ConfigService, ordersService: any) => {
        const paymentsMode = configService.get<string>(
          'PAYMENTS_MODE',
          'dummy',
        );

        if (paymentsMode === 'stripe') {
          logger.log('💳 Using STRIPE payments (production mode)');
          // Return null here - we'll use PaymentsService directly
          return null;
        }

        logger.warn('⚠️ Using DUMMY payments (development/testing mode)');
        logger.warn(
          '⚠️ Set PAYMENTS_MODE=stripe for real payments in production',
        );
        return 'dummy';
      },
    },
    // Stripe Client - Only created when in stripe mode
    {
      provide: 'STRIPE_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const paymentsMode = configService.get<string>(
          'PAYMENTS_MODE',
          'dummy',
        );

        if (paymentsMode === 'dummy') {
          // Return a mock Stripe client for dummy mode
          return {
            paymentIntents: {
              create: () =>
                Promise.reject(new Error('Stripe disabled in dummy mode')),
              retrieve: () =>
                Promise.reject(new Error('Stripe disabled in dummy mode')),
              cancel: () =>
                Promise.reject(new Error('Stripe disabled in dummy mode')),
            },
            webhooks: {
              constructEvent: () => {
                throw new Error('Stripe webhooks disabled in dummy mode');
              },
            },
          };
        }

        const secretKey = configService.get<string>('STRIPE_SECRET_KEY');
        if (!secretKey) {
          throw new Error(
            'STRIPE_SECRET_KEY is required when PAYMENTS_MODE=stripe',
          );
        }
        logger.log('💳 Stripe client initialized');
        return new Stripe(secretKey, {
          apiVersion: '2025-11-17.clover',
        });
      },
    },
    PaymentsService,
    PaymentsMockService,
  ],
  exports: [PAYMENTS_SERVICE, PaymentsService, PaymentsMockService],
})
export class PaymentsModule {}
