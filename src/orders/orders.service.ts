import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderItem, OrderStatus } from './entities';
import { Product } from '../products/entities/product.entity';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  PaginationMetadata,
} from './dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: string): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate products and stock
      const orderItems: Partial<OrderItem>[] = [];
      let itemsPrice = 0;

      for (const item of createOrderDto.orderItems) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId },
        });

        if (!product) {
          throw new BadRequestException(
            `Producto ${item.productId} no encontrado`,
          );
        }

        if (product.stock < item.qty) {
          throw new BadRequestException(
            `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.qty}`,
          );
        }

        // Reduce stock
        product.stock -= item.qty;
        await queryRunner.manager.save(Product, product);

        // Calculate price
        const itemPrice = Number(product.price) * item.qty;
        itemsPrice += itemPrice;

        // Create order item (product snapshot)
        orderItems.push({
          name: product.name,
          qty: item.qty,
          image: product.image,
          price: product.price,
          productId: product.id,
        });
      }

      // Calculate totals
      const shippingPrice = createOrderDto.shippingPrice || 0;
      const taxPrice = createOrderDto.taxPrice || 0;
      const totalPrice = itemsPrice + shippingPrice + taxPrice;

      // Create order
      const order = queryRunner.manager.create(Order, {
        userId,
        shippingAddress: createOrderDto.shippingAddress,
        paymentMethod: createOrderDto.paymentMethod,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
        status: OrderStatus.PENDING,
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      // Create order items
      for (const item of orderItems) {
        const orderItem = queryRunner.manager.create(OrderItem, {
          ...item,
          orderId: savedOrder.id,
        });
        await queryRunner.manager.save(OrderItem, orderItem);
      }

      await queryRunner.commitTransaction();

      // Get the complete order with relations
      const completeOrder = await this.orderRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['user', 'orderItems', 'orderItems.product'],
      });

      // Send notifications
      try {
        await this.notificationsService.sendOrderConfirmation(completeOrder);
        await this.notificationsService.sendWebhookNotification(
          'order.created',
          completeOrder,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send order creation notifications: ${error.message}`,
        );
      }

      this.logger.log(`Order created: ${completeOrder.id} for user: ${userId}`);
      return completeOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create order: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findMyOrders(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      relations: ['user', 'orderItems', 'orderItems.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    // ParseUUIDPipe en el controller ya valida el UUID
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'orderItems', 'orderItems.product'],
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return order;
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{ data: Order[]; metadata: PaginationMetadata }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.orderRepository.find({
        relations: ['user', 'orderItems', 'orderItems.product'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      }),
      this.orderRepository.count(),
    ]);

    return {
      data,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'orderItems', 'orderItems.product'],
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    const oldStatus = order.status;
    order.status = updateOrderStatusDto.status;

    // Si el estado es PAID, marcar como pagado
    if (updateOrderStatusDto.status === OrderStatus.PAID) {
      order.isPaid = true;
      order.paidAt = new Date();

      if (updateOrderStatusDto.paymentResult) {
        order.paymentResult = updateOrderStatusDto.paymentResult;
      }
    }

    const updatedOrder = await order.save();

    // Enviar notificaciones
    try {
      await this.notificationsService.sendStatusUpdate(
        updatedOrder,
        oldStatus,
        updateOrderStatusDto.status,
      );
      await this.notificationsService.sendWebhookNotification(
        'order.status_changed',
        updatedOrder,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send status update notifications: ${error.message}`,
      );
    }

    this.logger.log(
      `Order ${id} status updated: ${oldStatus} -> ${updateOrderStatusDto.status}`,
    );
    return updatedOrder;
  }

  async markAsDelivered(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'orderItems', 'orderItems.product'],
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    order.isDelivered = true;
    order.deliveredAt = new Date();
    order.status = OrderStatus.DELIVERED;

    const deliveredOrder = await order.save();

    // Enviar notificaciones
    try {
      await this.notificationsService.sendDeliveryConfirmation(deliveredOrder);
      await this.notificationsService.sendWebhookNotification(
        'order.delivered',
        deliveredOrder,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send delivery notifications: ${error.message}`,
      );
    }

    this.logger.log(`Order ${id} marked as delivered`);
    return deliveredOrder;
  }
}
