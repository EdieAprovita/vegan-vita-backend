import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let mockPaymentsService: jest.Mocked<PaymentsService>;

  beforeEach(async () => {
    mockPaymentsService = {
      createPaymentIntent: jest.fn(),
      getPaymentIntent: jest.fn(),
      handleWebhookEvent: jest.fn(),
    } as unknown as jest.Mocked<PaymentsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent', async () => {
      const mockRequest = {
        user: { id: 'user-123' },
      } as any;

      const mockDto = { orderId: 'order-123' };
      const mockResponse = {
        clientSecret: 'pi_123_secret',
        paymentIntentId: 'pi_123',
        amount: 10000,
        currency: 'usd',
        status: 'requires_payment_method',
      };

      mockPaymentsService.createPaymentIntent.mockResolvedValue(mockResponse);

      const result = await controller.createPaymentIntent(mockDto, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(mockPaymentsService.createPaymentIntent).toHaveBeenCalledWith(
        'order-123',
        'user-123',
      );
    });
  });

  describe('getPaymentIntent', () => {
    it('should get payment intent', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'succeeded',
      } as any;

      mockPaymentsService.getPaymentIntent.mockResolvedValue(mockPaymentIntent);

      const result = await controller.getPaymentIntent('pi_123');

      expect(result).toEqual(mockPaymentIntent);
      expect(mockPaymentsService.getPaymentIntent).toHaveBeenCalledWith(
        'pi_123',
      );
    });
  });

  describe('handleWebhook', () => {
    it('should handle webhook event', async () => {
      const mockRequest = {
        rawBody: Buffer.from('test payload'),
      } as any;

      mockPaymentsService.handleWebhookEvent.mockResolvedValue(undefined);

      const result = await controller.handleWebhook(
        'stripe-signature',
        mockRequest,
      );

      expect(result).toEqual({ received: true });
      expect(mockPaymentsService.handleWebhookEvent).toHaveBeenCalled();
    });
  });
});
