import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsMockService } from './payments-mock.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PAYMENTS_SERVICE } from './interfaces/payment-service.interface';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let mockPaymentsService: jest.Mocked<PaymentsService>;
  let mockPaymentsMockService: jest.Mocked<PaymentsMockService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockPaymentsService = {
      createPaymentIntent: jest.fn(),
      getPaymentIntent: jest.fn(),
      handleWebhookEvent: jest.fn(),
    } as unknown as jest.Mocked<PaymentsService>;

    mockPaymentsMockService = {
      createPaymentIntent: jest.fn(),
      getPaymentIntent: jest.fn(),
      simulatePaymentSuccess: jest.fn(),
      simulatePaymentFailure: jest.fn(),
      simulateRefund: jest.fn(),
      getAllMockPaymentIntents: jest.fn(),
      clearAllMockPaymentIntents: jest.fn(),
    } as unknown as jest.Mocked<PaymentsMockService>;

    mockConfigService = {
      get: jest.fn().mockReturnValue('dummy'),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
        {
          provide: PaymentsMockService,
          useValue: mockPaymentsMockService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PAYMENTS_SERVICE,
          useValue: 'dummy', // Default to dummy mode for tests
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPaymentMode', () => {
    it('should return current payment mode', () => {
      const result = controller.getPaymentMode();
      expect(result.mode).toBe('dummy');
      expect(result.isDummy).toBe(true);
    });
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent using mock service in dummy mode', async () => {
      const mockRequest = {
        user: { id: 'user-123' },
      } as any;

      const mockDto = { orderId: 'order-123' };
      const mockResponse = {
        clientSecret: 'pi_mock_123_secret',
        paymentIntentId: 'pi_mock_123',
        amount: 10000,
        currency: 'usd',
        status: 'requires_payment_method',
      };

      mockPaymentsMockService.createPaymentIntent.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.createPaymentIntent(mockDto, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(mockPaymentsMockService.createPaymentIntent).toHaveBeenCalledWith(
        'order-123',
        'user-123',
      );
      // Should NOT call the real payments service
      expect(mockPaymentsService.createPaymentIntent).not.toHaveBeenCalled();
    });
  });

  describe('getPaymentIntent', () => {
    it('should get payment intent using mock service in dummy mode', async () => {
      const mockPaymentIntent = {
        id: 'pi_mock_123',
        status: 'requires_payment_method',
      } as any;

      mockPaymentsMockService.getPaymentIntent.mockResolvedValue(
        mockPaymentIntent,
      );

      const result = await controller.getPaymentIntent('pi_mock_123');

      expect(result).toEqual(mockPaymentIntent);
      expect(mockPaymentsMockService.getPaymentIntent).toHaveBeenCalledWith(
        'pi_mock_123',
      );
    });
  });

  describe('handleWebhook', () => {
    it('should return mock response in dummy mode', async () => {
      const mockRequest = {
        rawBody: Buffer.from('test payload'),
      } as any;

      const result = await controller.handleWebhook(
        'stripe-signature',
        mockRequest,
      );

      expect(result).toEqual({
        received: true,
        message: '[MOCK] Webhook recibido en modo dummy - no procesado',
      });
      // Should NOT call the real webhook handler in dummy mode
      expect(mockPaymentsService.handleWebhookEvent).not.toHaveBeenCalled();
    });
  });

  describe('simulate endpoints (dummy mode only)', () => {
    it('should simulate payment success', async () => {
      const mockResult = {
        success: true,
        message: '[MOCK] Pago simulado exitosamente',
        order: { id: 'order-123', isPaid: true },
      };
      mockPaymentsMockService.simulatePaymentSuccess.mockResolvedValue(
        mockResult,
      );

      const result = await controller.simulatePaymentSuccess('order-123');

      expect(result).toEqual(mockResult);
      expect(
        mockPaymentsMockService.simulatePaymentSuccess,
      ).toHaveBeenCalledWith('order-123');
    });

    it('should simulate payment failure', async () => {
      const mockResult = {
        success: true,
        message: '[MOCK] Pago fallido simulado',
        order: { id: 'order-123', isPaid: false },
      };
      mockPaymentsMockService.simulatePaymentFailure.mockResolvedValue(
        mockResult,
      );

      const result = await controller.simulatePaymentFailure('order-123', {
        reason: 'Test',
      });

      expect(result).toEqual(mockResult);
      expect(
        mockPaymentsMockService.simulatePaymentFailure,
      ).toHaveBeenCalledWith('order-123', 'Test');
    });

    it('should simulate refund', async () => {
      const mockResult = {
        success: true,
        message: '[MOCK] Reembolso simulado',
        order: { id: 'order-123', isRefunded: true },
      };
      mockPaymentsMockService.simulateRefund.mockResolvedValue(mockResult);

      const result = await controller.simulateRefund('order-123');

      expect(result).toEqual(mockResult);
      expect(mockPaymentsMockService.simulateRefund).toHaveBeenCalledWith(
        'order-123',
      );
    });

    it('should get all mock payment intents', () => {
      const mockIntents = [{ id: 'pi_mock_1' }, { id: 'pi_mock_2' }];
      mockPaymentsMockService.getAllMockPaymentIntents.mockReturnValue(
        mockIntents as any,
      );

      const result = controller.getAllMockPaymentIntents();

      expect(result).toEqual(mockIntents);
    });

    it('should clear all mock payment intents', () => {
      const result = controller.clearAllMockPaymentIntents();

      expect(result.success).toBe(true);
      expect(
        mockPaymentsMockService.clearAllMockPaymentIntents,
      ).toHaveBeenCalled();
    });
  });
});
