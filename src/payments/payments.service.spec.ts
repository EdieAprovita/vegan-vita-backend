import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import Stripe from 'stripe';
import { OrderStatus } from '../orders/entities/order-status.enum';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mockStripe: jest.Mocked<Stripe>;
  let mockOrdersService: jest.Mocked<OrdersService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  const mockOrder = {
    id: 'order-123',
    userId: 'user-123',
    totalPrice: 100.0,
    isPaid: false,
    status: OrderStatus.PENDING,
    stripePaymentIntentId: null,
    stripePaymentStatus: null,
  };

  beforeEach(async () => {
    mockStripe = {
      paymentIntents: {
        create: jest.fn(),
        retrieve: jest.fn(),
        cancel: jest.fn(),
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
    } as unknown as jest.Mocked<Stripe>;

    mockOrdersService = {
      findOne: jest.fn(),
      updatePaymentStatus: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<OrdersService>;

    mockConfigService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: 'STRIPE_CLIENT',
          useValue: mockStripe,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder as any);
      (mockStripe.paymentIntents.create as jest.Mock).mockResolvedValue({
        id: 'pi_123',
        client_secret: 'pi_123_secret',
        amount: 10000,
        currency: 'usd',
        status: 'requires_payment_method',
      } as Stripe.PaymentIntent);

      const result = await service.createPaymentIntent('order-123', 'user-123');

      expect(result.paymentIntentId).toBe('pi_123');
      expect(result.clientSecret).toBe('pi_123_secret');
      expect(mockStripe.paymentIntents.create).toHaveBeenCalled();
      expect(mockOrdersService.updatePaymentStatus).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own the order', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder as any);

      await expect(
        service.createPaymentIntent('order-123', 'different-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if order is already paid', async () => {
      const paidOrder = { ...mockOrder, isPaid: true };
      mockOrdersService.findOne.mockResolvedValue(paidOrder as any);

      await expect(
        service.createPaymentIntent('order-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return existing payment intent if one already exists', async () => {
      const orderWithIntent = {
        ...mockOrder,
        stripePaymentIntentId: 'pi_existing',
      };
      mockOrdersService.findOne.mockResolvedValue(orderWithIntent as any);
      (mockStripe.paymentIntents.retrieve as jest.Mock).mockResolvedValue({
        id: 'pi_existing',
        client_secret: 'pi_existing_secret',
        amount: 10000,
        currency: 'usd',
        status: 'requires_payment_method',
      } as Stripe.PaymentIntent);

      const result = await service.createPaymentIntent('order-123', 'user-123');

      expect(result.paymentIntentId).toBe('pi_existing');
      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhookEvent', () => {
    const mockEvent = {
      id: 'evt_123',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_123',
          status: 'succeeded',
          metadata: { orderId: 'order-123' },
        } as any,
      },
    } as Stripe.Event;

    beforeEach(() => {
      mockConfigService.get.mockReturnValue('whsec_test_secret');
      (mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue(
        mockEvent,
      );
    });

    it('should handle payment_intent.succeeded event', async () => {
      mockOrdersService.updatePaymentStatus.mockResolvedValue(mockOrder as any);

      await service.handleWebhookEvent('signature', Buffer.from('payload'));

      expect(mockOrdersService.updatePaymentStatus).toHaveBeenCalledWith(
        'order-123',
        expect.objectContaining({
          isPaid: true,
        }),
      );
    });

    it('should skip already processed events', async () => {
      mockOrdersService.updatePaymentStatus.mockResolvedValue(mockOrder as any);

      await service.handleWebhookEvent('signature', Buffer.from('payload'));
      await service.handleWebhookEvent('signature', Buffer.from('payload'));

      expect(mockOrdersService.updatePaymentStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPaymentIntent', () => {
    it('should retrieve payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'succeeded',
      } as Stripe.PaymentIntent;

      (mockStripe.paymentIntents.retrieve as jest.Mock).mockResolvedValue(
        mockPaymentIntent,
      );

      const result = await service.getPaymentIntent('pi_123');

      expect(result).toEqual(mockPaymentIntent);
      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_123');
    });
  });
});
