import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order, OrderItem, OrderStatus } from './entities';
import { Product } from '../products/entities/product.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource, QueryRunner, Repository } from 'typeorm';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockOrderRepository: jest.Mocked<Repository<Order>>;
  let mockOrderItemRepository: jest.Mocked<Repository<OrderItem>>;
  let mockProductRepository: jest.Mocked<Repository<Product>>;
  let mockNotificationsService: jest.Mocked<NotificationsService>;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;

  beforeEach(async () => {
    mockOrderRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<Repository<Order>>;

    mockOrderItemRepository = {
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<OrderItem>>;

    mockProductRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<Product>>;

    mockNotificationsService = {
      sendOrderConfirmation: jest.fn(),
      sendStatusUpdate: jest.fn(),
      sendDeliveryConfirmation: jest.fn(),
      sendWebhookNotification: jest.fn(),
    } as unknown as jest.Mocked<NotificationsService>;

    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
      } as Partial<jest.Mocked<QueryRunner['manager']>>,
    } as unknown as jest.Mocked<QueryRunner>;

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as unknown as jest.Mocked<DataSource>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
    };

    const createOrderDto = {
      orderItems: [
        { productId: 'prod-1', qty: 2 },
        { productId: 'prod-2', qty: 1 },
      ],
      shippingAddress: {
        fullName: 'John Doe',
        address: '123 Main St',
        city: 'New York',
        postalCode: '10001',
        country: 'USA',
        phone: '+1 234567890',
      },
      paymentMethod: 'PayPal',
      shippingPrice: 10,
      taxPrice: 5,
    };

    const mockProducts = [
      {
        id: 'prod-1',
        name: 'Product 1',
        price: 25.99,
        stock: 10,
        image: '/images/prod1.jpg',
      },
      {
        id: 'prod-2',
        name: 'Product 2',
        price: 15.5,
        stock: 5,
        image: '/images/prod2.jpg',
      },
    ];

    it('should create an order successfully with transaction', async () => {
      (mockQueryRunner.manager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockProducts[0])
        .mockResolvedValueOnce(mockProducts[1]);

      const savedOrder = {
        id: 'order-1',
        userId: mockUser.id,
        user: mockUser,
        orderItems: [],
        ...createOrderDto,
        itemsPrice: 67.48,
        totalPrice: 82.48,
        status: OrderStatus.PENDING,
        isPaid: false,
        isDelivered: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockQueryRunner.manager.create as jest.Mock).mockReturnValue(savedOrder);
      (mockQueryRunner.manager.save as jest.Mock).mockResolvedValue(savedOrder);
      mockOrderRepository.findOne.mockResolvedValue(savedOrder as Order);

      const result = await service.create(createOrderDto, mockUser.id);

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(
        mockNotificationsService.sendOrderConfirmation,
      ).toHaveBeenCalledWith(savedOrder);
      expect(
        mockNotificationsService.sendWebhookNotification,
      ).toHaveBeenCalledWith('order.created', savedOrder);
      expect(result).toEqual(savedOrder);
    });

    it('should throw BadRequestException when product not found', async () => {
      (mockQueryRunner.manager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.create(createOrderDto, mockUser.id)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createOrderDto, mockUser.id)).rejects.toThrow(
        'Product prod-1 not found',
      );

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      const lowStockProduct = { ...mockProducts[0], stock: 1 };
      (mockQueryRunner.manager.findOne as jest.Mock).mockResolvedValue(
        lowStockProduct,
      );

      await expect(service.create(createOrderDto, mockUser.id)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createOrderDto, mockUser.id)).rejects.toThrow(
        'Insufficient stock',
      );

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      (mockQueryRunner.manager.findOne as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.create(createOrderDto, mockUser.id),
      ).rejects.toThrow();

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should calculate totals correctly', async () => {
      (mockQueryRunner.manager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockProducts[0])
        .mockResolvedValueOnce(mockProducts[1]);

      const savedOrder = {
        id: 'order-1',
        itemsPrice: 67.48, // (25.99 * 2) + (15.50 * 1)
        shippingPrice: 10,
        taxPrice: 5,
        totalPrice: 82.48,
      };

      (mockQueryRunner.manager.create as jest.Mock).mockReturnValue(savedOrder);
      (mockQueryRunner.manager.save as jest.Mock).mockResolvedValue(savedOrder);
      mockOrderRepository.findOne.mockResolvedValue(savedOrder as Order);

      const result = await service.create(createOrderDto, mockUser.id);

      expect(Number(result.itemsPrice)).toBe(67.48);
      expect(Number(result.totalPrice)).toBe(82.48);
    });
  });

  describe('findMyOrders', () => {
    it('should return all orders for a user', async () => {
      const userId = 'user-1';
      const mockOrders = [
        { id: 'order-1', userId, status: OrderStatus.PENDING },
        { id: 'order-2', userId, status: OrderStatus.DELIVERED },
      ];

      mockOrderRepository.find.mockResolvedValue(mockOrders as Order[]);

      const result = await service.findMyOrders(userId);

      expect(mockOrderRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['user', 'orderItems', 'orderItems.product'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockOrders);
    });

    it('should return empty array when user has no orders', async () => {
      mockOrderRepository.find.mockResolvedValue([]);

      const result = await service.findMyOrders('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        status: OrderStatus.PENDING,
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder as Order);

      const result = await service.findOne('order-1');

      expect(mockOrderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        relations: ['user', 'orderItems', 'orderItems.product'],
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when order not found', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Order not found',
      );
    });
  });

  describe('updateStatus', () => {
    const mockOrder = {
      id: 'order-1',
      userId: 'user-1',
      status: OrderStatus.PENDING,
      isPaid: false,
      paidAt: null,
      user: { id: 'user-1', email: 'user@example.com', name: 'Test User' },
      save: jest.fn(),
    };

    it('should update order status and send notifications', async () => {
      mockOrderRepository.findOne.mockResolvedValue(
        mockOrder as unknown as Order,
      );
      mockOrder.save.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
      });

      await service.updateStatus('order-1', {
        status: OrderStatus.PAID,
      });

      expect(mockOrder.status).toBe(OrderStatus.PAID);
      expect(mockNotificationsService.sendStatusUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        OrderStatus.PENDING,
        OrderStatus.PAID,
      );
      expect(
        mockNotificationsService.sendWebhookNotification,
      ).toHaveBeenCalledWith('order.status_changed', expect.any(Object));
    });

    it('should mark order as paid when status is PAID', async () => {
      mockOrderRepository.findOne.mockResolvedValue(
        mockOrder as unknown as Order,
      );
      mockOrder.save.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
        isPaid: true,
      });

      await service.updateStatus('order-1', { status: OrderStatus.PAID });

      expect(mockOrder.isPaid).toBe(true);
      expect(mockOrder.paidAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when order not found', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('nonexistent', { status: OrderStatus.PAID }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsDelivered', () => {
    it('should mark order as delivered and send confirmation', async () => {
      const mockOrder = {
        id: 'order-1',
        isDelivered: false,
        deliveredAt: null,
        status: OrderStatus.SHIPPED,
        user: { email: 'user@example.com' },
        save: jest.fn(),
      };

      mockOrderRepository.findOne.mockResolvedValue(
        mockOrder as unknown as Order,
      );
      mockOrder.save.mockResolvedValue({
        ...mockOrder,
        isDelivered: true,
        status: OrderStatus.DELIVERED,
      });

      await service.markAsDelivered('order-1');

      expect(mockOrder.isDelivered).toBe(true);
      expect(mockOrder.deliveredAt).toBeInstanceOf(Date);
      expect(mockOrder.status).toBe(OrderStatus.DELIVERED);
      expect(
        mockNotificationsService.sendDeliveryConfirmation,
      ).toHaveBeenCalledWith(expect.any(Object));
      expect(
        mockNotificationsService.sendWebhookNotification,
      ).toHaveBeenCalledWith('order.delivered', expect.any(Object));
    });
  });

  describe('findAll (Admin)', () => {
    it('should return paginated orders with metadata', async () => {
      const mockOrders = [
        { id: 'order-1', status: OrderStatus.PENDING },
        { id: 'order-2', status: OrderStatus.DELIVERED },
      ];

      mockOrderRepository.find.mockResolvedValue(mockOrders as Order[]);
      mockOrderRepository.count.mockResolvedValue(10);

      const result = await service.findAll(1, 2);

      expect(mockOrderRepository.find).toHaveBeenCalledWith({
        relations: ['user', 'orderItems', 'orderItems.product'],
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 2,
      });
      expect(result).toEqual({
        data: mockOrders,
        metadata: {
          total: 10,
          page: 1,
          limit: 2,
          totalPages: 5,
        },
      });
    });

    it('should handle empty results', async () => {
      mockOrderRepository.find.mockResolvedValue([]);
      mockOrderRepository.count.mockResolvedValue(0);

      const result = await service.findAll(1, 10);

      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });
  });

  describe('validateOwnership', () => {
    it('should allow owner to access their order', async () => {
      const mockOrder = { id: 'order-1', userId: 'user-1' };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder as Order);

      const result = await service.findOne('order-1');

      expect(result).toEqual(mockOrder);
    });

    it('should allow admin to access any order', async () => {
      const mockOrder = { id: 'order-1', userId: 'user-1' };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder as Order);

      const result = await service.findOne('order-1');

      expect(result).toEqual(mockOrder);
    });
  });
});
