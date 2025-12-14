import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { OrderStatus } from '../orders/entities/order-status.enum';

jest.mock('nodemailer');
jest.mock('fs');

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockConfigService: Partial<ConfigService>;
  let mockTransporter: any;
  let originalNodeEnv: string | undefined;

  beforeEach(async () => {
    // Save original NODE_ENV
    originalNodeEnv = process.env.NODE_ENV;
    // Set to non-test environment to allow email sending in tests
    process.env.NODE_ENV = 'development';

    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    // Mock fs.readFileSync to return a simple template
    (fs.readFileSync as jest.Mock).mockReturnValue(`
      <html>
        <body>
          <h1>{{userName}}</h1>
          <p>{{orderId}}</p>
        </body>
      </html>
    `);

    mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          SMTP_HOST: 'smtp.test.com',
          SMTP_PORT: '587',
          SMTP_USER: 'test@test.com',
          SMTP_PASS: 'testpass',
          SMTP_FROM: 'noreply@veganvita.com',
          FRONTEND_URL: 'http://localhost:3000',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOrderConfirmation', () => {
    it('should send order confirmation email successfully', async () => {
      const mockOrder: Partial<Order> = {
        id: '123',
        userId: 'user-1',
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashed',
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        orderItems: [
          {
            id: 'item-1',
            name: 'Product 1',
            qty: 2,
            price: 10.99,
            image: '/images/product1.jpg',
            productId: 'prod-1',
            orderId: '123',
          } as Partial<OrderItem>,
        ] as OrderItem[],
        shippingAddress: {
          fullName: 'John Doe',
          address: '123 Main St',
          city: 'New York',
          postalCode: '10001',
          country: 'USA',
        },
        paymentMethod: 'PayPal',
        itemsPrice: 21.98,
        shippingPrice: 5.0,
        taxPrice: 2.2,
        totalPrice: 29.18,
        status: OrderStatus.PENDING,
        isPaid: false,
        paidAt: null,
        isDelivered: false,
        deliveredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await service.sendOrderConfirmation(mockOrder as Order);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@veganvita.com',
          to: 'john@example.com',
          subject: expect.stringContaining('Order Confirmation'),
        }),
      );
    });

    it('should handle email sending errors gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

      const mockOrder: Partial<Order> = {
        id: '123',
        userId: 'user-1',
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashed',
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        orderItems: [
          {
            id: 'item-1',
            name: 'Product 1',
            qty: 2,
            price: 10.99,
            image: '/images/product1.jpg',
            productId: 'prod-1',
            orderId: '123',
          } as Partial<OrderItem>,
        ] as OrderItem[],
        shippingAddress: {
          fullName: 'John Doe',
          address: '123 Main St',
          city: 'New York',
          postalCode: '10001',
          country: 'USA',
          phone: '+1 234567890',
        },
        paymentMethod: 'PayPal',
        itemsPrice: 21.98,
        shippingPrice: 5.0,
        taxPrice: 2.2,
        totalPrice: 29.18,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
      } as Order;

      await expect(
        service.sendOrderConfirmation(mockOrder as Order),
      ).rejects.toThrow('SMTP Error');
    });
  });

  describe('sendStatusUpdate', () => {
    it('should send status update email for each status change', async () => {
      const mockOrder: Partial<Order> = {
        id: '123',
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashed',
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        status: OrderStatus.SHIPPED,
      } as Order;

      await service.sendStatusUpdate(
        mockOrder as Order,
        OrderStatus.PENDING,
        OrderStatus.SHIPPED,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@veganvita.com',
          to: 'john@example.com',
          subject: expect.stringContaining('Order Update'),
        }),
      );
    });
  });

  describe('sendDeliveryConfirmation', () => {
    it('should send delivery confirmation email', async () => {
      const mockOrder: Partial<Order> = {
        id: '123',
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashed',
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        shippingAddress: {
          fullName: 'John Doe',
          address: '123 Main St',
          city: 'New York',
          postalCode: '10001',
          country: 'USA',
          phone: '+1 234567890',
        },
        deliveredAt: new Date(),
      } as Order;

      await service.sendDeliveryConfirmation(mockOrder as Order);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@veganvita.com',
          to: 'john@example.com',
          subject: expect.stringContaining('Delivered'),
        }),
      );
    });
  });

  describe('getStatusMessage', () => {
    it('should return appropriate messages for each status', () => {
      expect(service['getStatusMessage'](OrderStatus.PENDING)).toContain(
        'Pending',
      );
      expect(service['getStatusMessage'](OrderStatus.PROCESSING)).toContain(
        'Processing',
      );
      expect(service['getStatusMessage'](OrderStatus.PAID)).toContain('Paid');
      expect(service['getStatusMessage'](OrderStatus.SHIPPED)).toContain(
        'Shipped',
      );
      expect(service['getStatusMessage'](OrderStatus.DELIVERED)).toContain(
        'Delivered',
      );
      expect(service['getStatusMessage'](OrderStatus.CANCELLED)).toContain(
        'Cancelled',
      );
    });
  });
});
