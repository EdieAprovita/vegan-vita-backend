import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../auth/entities/user.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getOrCreateCart(user: User): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      cart = this.cartRepository.create({ user });
      await this.cartRepository.save(cart);
    }

    return cart;
  }

  async getCart(user: User): Promise<Cart> {
    return this.getOrCreateCart(user);
  }

  async addItem(user: User, addToCartDto: AddToCartDto): Promise<Cart> {
    const { productId, quantity } = addToCartDto;

    // Validar que el producto existe
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Validar stock
    if (product.stock < quantity) {
      throw new BadRequestException(
        `Stock insuficiente. Solo hay ${product.stock} unidades disponibles`,
      );
    }

    const cart = await this.getOrCreateCart(user);

    // Verificar si el producto ya está en el carrito
    const existingItem = cart.items.find(
      (item) => item.product.id === productId,
    );

    if (existingItem) {
      // Actualizar cantidad
      const newQuantity = existingItem.quantity + quantity;

      if (product.stock < newQuantity) {
        throw new BadRequestException(
          `Stock insuficiente. Solo hay ${product.stock} unidades disponibles`,
        );
      }

      existingItem.quantity = newQuantity;
      await this.cartItemRepository.save(existingItem);
    } else {
      // Crear nuevo item
      const cartItem = this.cartItemRepository.create({
        cart,
        product,
        quantity,
        price: product.price,
      });
      await this.cartItemRepository.save(cartItem);
    }

    return this.getCart(user);
  }

  async updateItem(
    user: User,
    itemId: string,
    updateDto: UpdateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.getCart(user);

    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException('Item no encontrado en el carrito');
    }

    // Validar stock
    if (item.product.stock < updateDto.quantity) {
      throw new BadRequestException(
        `Stock insuficiente. Solo hay ${item.product.stock} unidades disponibles`,
      );
    }

    item.quantity = updateDto.quantity;
    await this.cartItemRepository.save(item);

    return this.getCart(user);
  }

  async removeItem(user: User, itemId: string): Promise<Cart> {
    const cart = await this.getCart(user);

    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException('Item no encontrado en el carrito');
    }

    await this.cartItemRepository.remove(item);

    return this.getCart(user);
  }

  async clearCart(user: User): Promise<{ message: string }> {
    const cart = await this.getCart(user);

    if (cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }

    return { message: 'Carrito vaciado exitosamente' };
  }
}
