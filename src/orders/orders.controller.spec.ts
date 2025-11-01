import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { Order, OrderStatus } from './entities';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('OrdersController', () => {
  let controller: OrdersController;
  let mockOrdersService: jest.Mocked<OrdersService>;

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    isAdmin: false,
  };

  const mockAdmin = {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    isAdmin: true,
  };

  const mockOrder: Partial<Order> = {
    id: 'order-1',
    userId: 'user-1',
    status: OrderStatus.PENDING,
    itemsPrice: 100,
    shippingPrice: 10,
    taxPrice: 5,
    totalPrice: 115,
    isPaid: false,
    isDelivered: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockOrdersService = {
      create: jest.fn(),
      findMyOrders: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      updateStatus: jest.fn(),
      markAsDelivered: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createOrderDto: CreateOrderDto = {
      orderItems: [{ productId: 'prod-1', qty: 2 }],
      shippingAddress: {
        address: '123 Main St',
        city: 'New York',
        postalCode: '10001',
        country: 'USA',
      },
      paymentMethod: 'PayPal',
      shippingPrice: 10,
      taxPrice: 5,
    };

    it('should create a new order', async () => {
      mockOrdersService.create.mockResolvedValue(mockOrder as Order);

      const result = await controller.create(createOrderDto, {
        user: mockUser,
      });

      expect(mockOrdersService.create).toHaveBeenCalledWith(
        createOrderDto,
        mockUser.id,
      );
      expect(result).toEqual(mockOrder);
    });

    it('should throw error when order creation fails', async () => {
      mockOrdersService.create.mockRejectedValue(
        new Error('Stock insuficiente'),
      );

      await expect(
        controller.create(createOrderDto, { user: mockUser }),
      ).rejects.toThrow('Stock insuficiente');
    });
  });

  describe('getMyOrders', () => {
    it('should return all orders for authenticated user', async () => {
      const mockOrders = [mockOrder, { ...mockOrder, id: 'order-2' }];
      mockOrdersService.findMyOrders.mockResolvedValue(mockOrders as Order[]);

      const result = await controller.getMyOrders({ user: mockUser });

      expect(mockOrdersService.findMyOrders).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockOrders);
    });

    it('should return empty array when user has no orders', async () => {
      mockOrdersService.findMyOrders.mockResolvedValue([]);

      const result = await controller.getMyOrders({ user: mockUser });

      expect(result).toEqual([]);
    });
  });

  describe('getOrderById', () => {
    it('should return order by id for owner', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder as Order);

      const result = await controller.getOrderById('order-1', {
        user: mockUser,
      });

      expect(mockOrdersService.findOne).toHaveBeenCalledWith('order-1');
      expect(result).toEqual(mockOrder);
    });

    it('should allow admin to view any order', async () => {
      const otherUserOrder = { ...mockOrder, userId: 'other-user' };
      mockOrdersService.findOne.mockResolvedValue(otherUserOrder as Order);

      const result = await controller.getOrderById('order-1', {
        user: mockAdmin,
      });

      expect(result).toEqual(otherUserOrder);
    });

    it('should throw ForbiddenException when non-owner tries to access', async () => {
      const otherUserOrder = { ...mockOrder, userId: 'other-user' };
      mockOrdersService.findOne.mockResolvedValue(otherUserOrder as Order);

      await expect(
        controller.getOrderById('order-1', { user: mockUser }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        controller.getOrderById('order-1', { user: mockUser }),
      ).rejects.toThrow('No tienes permiso para acceder a esta orden');
    });

    it('should throw NotFoundException when order not found', async () => {
      mockOrdersService.findOne.mockRejectedValue(
        new NotFoundException('Orden no encontrada'),
      );

      await expect(
        controller.getOrderById('nonexistent', { user: mockUser }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOrderStatus', () => {
    const updateStatusDto: UpdateOrderStatusDto = {
      status: OrderStatus.PAID,
    };

    it('should update order status', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder as Order);
      const updatedOrder = { ...mockOrder, status: OrderStatus.PAID };
      mockOrdersService.updateStatus.mockResolvedValue(updatedOrder as Order);

      const result = await controller.updateOrderStatus(
        'order-1',
        updateStatusDto,
        { user: mockUser },
      );

      expect(mockOrdersService.updateStatus).toHaveBeenCalledWith(
        'order-1',
        updateStatusDto,
      );
      expect(result.status).toBe(OrderStatus.PAID);
    });

    it('should allow owner to mark order as paid', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder as Order);
      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.PAID,
        isPaid: true,
      };
      mockOrdersService.updateStatus.mockResolvedValue(updatedOrder as Order);

      const result = await controller.updateOrderStatus(
        'order-1',
        updateStatusDto,
        { user: mockUser },
      );

      expect(result.isPaid).toBe(true);
    });

    it('should throw ForbiddenException when non-owner tries to update', async () => {
      const otherUserOrder = { ...mockOrder, userId: 'other-user' };
      mockOrdersService.findOne.mockResolvedValue(otherUserOrder as Order);

      await expect(
        controller.updateOrderStatus('order-1', updateStatusDto, {
          user: mockUser,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('markAsDelivered', () => {
    it('should mark order as delivered (admin only)', async () => {
      const deliveredOrder = {
        ...mockOrder,
        isDelivered: true,
        status: OrderStatus.DELIVERED,
      };
      mockOrdersService.markAsDelivered.mockResolvedValue(
        deliveredOrder as Order,
      );

      const result = await controller.markAsDelivered('order-1');

      expect(mockOrdersService.markAsDelivered).toHaveBeenCalledWith('order-1');
      expect(result.isDelivered).toBe(true);
      expect(result.status).toBe(OrderStatus.DELIVERED);
    });
  });

  describe('getAllOrders', () => {
    it('should return paginated orders for admin', async () => {
      const paginatedResult = {
        data: [mockOrder, { ...mockOrder, id: 'order-2' }],
        metadata: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
      mockOrdersService.findAll.mockResolvedValue(paginatedResult as any);

      const result = await controller.getAllOrders(1, 10);

      expect(mockOrdersService.findAll).toHaveBeenCalledWith(1, 10);
      expect(result.orders).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should handle pagination correctly', async () => {
      const paginatedResult = {
        data: [mockOrder],
        metadata: {
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
        },
      };
      mockOrdersService.findAll.mockResolvedValue(paginatedResult as any);

      const result = await controller.getAllOrders(2, 10);

      expect(mockOrdersService.findAll).toHaveBeenCalledWith(2, 10);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it('should use default pagination values', async () => {
      const paginatedResult = {
        data: [],
        metadata: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
      mockOrdersService.findAll.mockResolvedValue(paginatedResult as any);

      await controller.getAllOrders();

      expect(mockOrdersService.findAll).toHaveBeenCalledWith(1, 10);
    });
  });
});
