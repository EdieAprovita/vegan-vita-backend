import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ShippingAddress } from './entities/shipping-address.entity';
import { User } from '../auth/entities/user.entity';
import { CartService } from '../cart/cart.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from './enums/order-status.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(ShippingAddress)
    private readonly shippingAddressRepository: Repository<ShippingAddress>,
    private readonly cartService: CartService,
  ) {}

  async create(user: User, createOrderDto: CreateOrderDto): Promise<Order> {
    const cart = await this.cartService.getCart(user);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    // Crear dirección de envío
    const shippingAddress = this.shippingAddressRepository.create(
      createOrderDto.shippingAddress,
    );
    await this.shippingAddressRepository.save(shippingAddress);

    // Calcular totales
    const subtotal = cart.total;
    const shippingPrice = createOrderDto.shippingPrice || 0;
    const taxPrice = createOrderDto.taxPrice || 0;
    const totalPrice = subtotal + shippingPrice + taxPrice;

    // Crear orden
    const order = this.orderRepository.create({
      user,
      shippingAddress,
      subtotal,
      shippingPrice,
      taxPrice,
      totalPrice,
      status: OrderStatus.PENDING,
    });

    await this.orderRepository.save(order);

    // Crear items de la orden desde el carrito
    const orderItems = cart.items.map((cartItem) =>
      this.orderItemRepository.create({
        order,
        product: cartItem.product,
        quantity: cartItem.quantity,
        price: cartItem.price,
      }),
    );

    await this.orderItemRepository.save(orderItems);

    // Vaciar carrito
    await this.cartService.clearCart(user);

    // Retornar orden completa
    return this.findOne(order.id, user);
  }

  async findAll(user: User): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: ['items', 'items.product', 'shippingAddress'],
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return order;
  }

  async updateStatus(
    id: string,
    updateDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (updateDto.status) {
      order.status = updateDto.status;
    }

    if (updateDto.isDelivered !== undefined) {
      order.isDelivered = updateDto.isDelivered;
      if (updateDto.isDelivered) {
        order.deliveredAt = new Date();
      }
    }

    await this.orderRepository.save(order);

    return this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'shippingAddress'],
    });
  }

  async markAsPaid(
    id: string,
    paymentIntentId: string,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentIntentId = paymentIntentId;
    order.status = OrderStatus.PAID;

    await this.orderRepository.save(order);

    return this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'shippingAddress'],
    });
  }

  // Métodos para Admin
  async findAllOrders(): Promise<Order[]> {
    return this.orderRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}
