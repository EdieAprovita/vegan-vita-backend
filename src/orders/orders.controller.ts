import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
  ParseUUIDPipe,
  DefaultValuePipe,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  PaginatedOrdersResponse,
} from './dto';
import { Order } from './entities';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    return this.ordersService.create(createOrderDto, req.user.id);
  }

  @Get('myorders')
  async getMyOrders(@Request() req) {
    return this.ordersService.findMyOrders(req.user.id);
  }

  @Get(':id')
  async getOrderById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req,
  ) {
    const order = await this.ordersService.findOne(id);

    // Solo el dueño de la orden o un admin puede verla
    if (order.userId !== req.user.id && !req.user.isAdmin) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a esta orden',
      );
    }

    return order;
  }

  @Put(':id/status')
  async updateOrderStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Request() req,
  ) {
    const order = await this.ordersService.findOne(id);

    // Solo el dueño de la orden o un admin pueden actualizar el estado
    if (order.userId !== req.user.id && !req.user.isAdmin) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar esta orden',
      );
    }

    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }

  @Put(':id/deliver')
  @UseGuards(AdminGuard)
  async markAsDelivered(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.ordersService.markAsDelivered(id);
  }

  @Get()
  @UseGuards(AdminGuard)
  async getAllOrders(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<PaginatedOrdersResponse<Order>> {
    const { data, metadata } = await this.ordersService.findAll(page, limit);
    return {
      orders: data,
      total: metadata.total,
      page: metadata.page,
      totalPages: metadata.totalPages,
    };
  }
}
