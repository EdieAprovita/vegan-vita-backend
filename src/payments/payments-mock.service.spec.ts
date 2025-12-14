import { Test, TestingModule } from '@nestjs/testing';
import {
  PaymentsMockService,
  MockPaymentIntent,
} from './payments-mock.service';
import { OrdersService } from '../orders/orders.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '../orders/entities/order-status.enum';

describe('PaymentsMockService', () => {
  let service: PaymentsMockService;
  let mockOrdersService: jest.Mocked<OrdersService>;

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
    mockOrdersService = {
      findOne: jest.fn(),
      updatePaymentStatus: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<OrdersService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsMockService,
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    service = module.get<PaymentsMockService>(PaymentsMockService);
  });

  afterEach(() => {
    // Clean up mock payment intents
    service.clearAllMockPaymentIntents();
  });

  describe('createPaymentIntent', () => {
    it('should create a mock payment intent successfully', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder as any);
      mockOrdersService.updatePaymentStatus.mockResolvedValue(mockOrder as any);

      const result = await service.createPaymentIntent('order-123', 'user-123');

      expect(result.paymentIntentId).toMatch(/^pi_mock_/);
      expect(result.clientSecret).toContain('_secret_');
      expect(result.amount).toBe(10000); // $100 in cents
      expect(result.currency).toBe('usd');
      expect(result.status).toBe('requires_payment_method');
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

    it('should throw BadRequestException if order is cancelled', async () => {
      const cancelledOrder = { ...mockOrder, status: OrderStatus.CANCELLED };
      mockOrdersService.findOne.mockResolvedValue(cancelledOrder as any);

      await expect(
        service.createPaymentIntent('order-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if amount is less than $0.50', async () => {
      const lowPriceOrder = { ...mockOrder, totalPrice: 0.4 };
      mockOrdersService.findOne.mockResolvedValue(lowPriceOrder as any);

      await expect(
        service.createPaymentIntent('order-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return existing payment intent if one already exists', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder as any);
      mockOrdersService.updatePaymentStatus.mockResolvedValue(mockOrder as any);

      // Create first payment intent
      const firstResult = await service.createPaymentIntent(
        'order-123',
        'user-123',
      );

      // Update order to have the payment intent ID
      const orderWithIntent = {
        ...mockOrder,
        stripePaymentIntentId: firstResult.paymentIntentId,
      };
      mockOrdersService.findOne.mockResolvedValue(orderWithIntent as any);

      // Try to create again
      const secondResult = await service.createPaymentIntent(
        'order-123',
        'user-123',
      );

      expect(secondResult.paymentIntentId).toBe(firstResult.paymentIntentId);
    });
  });

  describe('getPaymentIntent', () => {
    it('should retrieve mock payment intent successfully', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder as any);
      mockOrdersService.updatePaymentStatus.mockResolvedValue(mockOrder as any);

      const created = await service.createPaymentIntent(
        'order-123',
        'user-123',
      );
      const retrieved = await service.getPaymentIntent(created.paymentIntentId);

      expect(retrieved.id).toBe(created.paymentIntentId);
      expect(retrieved.amount).toBe(10000);
    });

    it('should throw NotFoundException for non-existent payment intent', async () => {
      await expect(service.getPaymentIntent('pi_nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancelPaymentIntent', () => {
    it('should cancel a mock payment intent', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder as any);
      mockOrdersService.updatePaymentStatus.mockResolvedValue(mockOrder as any);

      const created = await service.createPaymentIntent(
        'order-123',
        'user-123',
      );
      const cancelled = await service.cancelPaymentIntent(
        created.paymentIntentId,
      );

      expect(cancelled.status).toBe('canceled');
    });

    it('should throw NotFoundException for non-existent payment intent', async () => {
      await expect(
        service.cancelPaymentIntent('pi_nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payment already succeeded', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder as any);
      mockOrdersService.updatePaymentStatus.mockResolvedValue({
        ...mockOrder,
        isPaid: true,
      } as any);

      const created = await service.createPaymentIntent(
        'order-123',
        'user-123',
      );

      // Manually set the payment intent as succeeded to simulate the scenario
      const allIntents = service.getAllMockPaymentIntents();
      const intent = allIntents.find((i) => i.id === created.paymentIntentId);
      if (intent) {
        intent.status = 'succeeded';
      }

      await expect(
        service.cancelPaymentIntent(created.paymentIntentId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('simulatePaymentSuccess', () => {
    it('should mark order as paid', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder as any);
      mockOrdersService.updatePaymentStatus.mockResolvedValue({
        ...mockOrder,
        isPaid: true,
      } as any);

      const result = await service.simulatePaymentSuccess('order-123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('MOCK');
      expect(mockOrdersService.updatePaymentStatus).toHaveBeenCalledWith(
        'order-123',
        expect.objectContaining({
          isPaid: true,
          stripePaymentStatus: 'succeeded',
        }),
      );
    });

    it('should throw BadRequestException if order is already paid', async () => {
      const paidOrder = { ...mockOrder, isPaid: true };
      mockOrdersService.findOne.mockResolvedValue(paidOrder as any);

      await expect(service.simulatePaymentSuccess('order-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if order is cancelled', async () => {
      const cancelledOrder = { ...mockOrder, status: OrderStatus.CANCELLED };
      mockOrdersService.findOne.mockResolvedValue(cancelledOrder as any);

      await expect(service.simulatePaymentSuccess('order-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('simulatePaymentFailure', () => {
    it('should mark payment as failed', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder as any);
      mockOrdersService.updatePaymentStatus.mockResolvedValue(mockOrder as any);

      const result = await service.simulatePaymentFailure(
        'order-123',
        'Insufficient funds',
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Insufficient funds');
      expect(mockOrdersService.updatePaymentStatus).toHaveBeenCalledWith(
        'order-123',
        expect.objectContaining({
          stripePaymentIntentId: expect.any(String),
          stripePaymentStatus: 'failed',
          isPaid: false,
        }),
      );
    });

    it('should throw BadRequestException if order is already paid', async () => {
      const paidOrder = { ...mockOrder, isPaid: true };
      mockOrdersService.findOne.mockResolvedValue(paidOrder as any);

      await expect(service.simulatePaymentFailure('order-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('simulateRefund', () => {
    it('should mark order as refunded', async () => {
      const paidOrder = { ...mockOrder, isPaid: true };
      mockOrdersService.findOne.mockResolvedValue(paidOrder as any);
      mockOrdersService.updatePaymentStatus.mockResolvedValue({
        ...paidOrder,
        isRefunded: true,
      } as any);

      const result = await service.simulateRefund('order-123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Reembolso');
      expect(mockOrdersService.updatePaymentStatus).toHaveBeenCalledWith(
        'order-123',
        expect.objectContaining({
          stripePaymentIntentId: expect.any(String),
          isRefunded: true,
          stripePaymentStatus: 'refunded',
        }),
      );
    });

    it('should throw BadRequestException if order is not paid', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder as any);

      await expect(service.simulateRefund('order-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getAllMockPaymentIntents', () => {
    it('should return all mock payment intents', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder as any);
      mockOrdersService.updatePaymentStatus.mockResolvedValue(mockOrder as any);

      await service.createPaymentIntent('order-123', 'user-123');

      const allIntents = service.getAllMockPaymentIntents();

      expect(allIntents).toHaveLength(1);
      expect(allIntents[0].metadata.orderId).toBe('order-123');
    });
  });

  describe('clearAllMockPaymentIntents', () => {
    it('should clear all mock payment intents', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder as any);
      mockOrdersService.updatePaymentStatus.mockResolvedValue(mockOrder as any);

      await service.createPaymentIntent('order-123', 'user-123');
      expect(service.getAllMockPaymentIntents()).toHaveLength(1);

      service.clearAllMockPaymentIntents();

      expect(service.getAllMockPaymentIntents()).toHaveLength(0);
    });
  });
});
