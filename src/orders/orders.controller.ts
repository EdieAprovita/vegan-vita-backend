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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  PaginatedOrdersResponse,
} from './dto';
import { Order } from './entities';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create order',
    description: 'Creates a new purchase order with selected products',
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or insufficient stock',
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req: RequestWithUser,
  ) {
    return this.ordersService.create(createOrderDto, req.user.id);
  }

  @Get('myorders')
  @ApiOperation({
    summary: 'Get my orders',
    description: 'Gets all orders for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders list retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getMyOrders(@Request() req: RequestWithUser) {
    return this.ordersService.findMyOrders(req.user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get order by ID',
    description: 'Gets a specific order (only the owner or admin can view it)',
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({
    status: 403,
    description: 'You do not have permission to view this order',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: RequestWithUser,
  ) {
    const order = await this.ordersService.findOne(id);

    // Only the order owner or an admin can view it
    if (order.userId !== req.user.id && !req.user.isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to access this order',
      );
    }

    return order;
  }

  @Put(':id/status')
  @ApiOperation({
    summary: 'Update order status',
    description:
      'Updates the status of an order (only the owner or admin can update it)',
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
    type: String,
    format: 'uuid',
  })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({
    status: 403,
    description: 'You do not have permission to update this order',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrderStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Request() req: RequestWithUser,
  ) {
    const order = await this.ordersService.findOne(id);

    // Only the order owner or an admin can update the status
    if (order.userId !== req.user.id && !req.user.isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to update this order',
      );
    }

    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }

  @Put(':id/deliver')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Mark order as delivered (Admin)',
    description: 'Marks an order as delivered (only administrators)',
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Order marked as delivered successfully',
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({
    status: 403,
    description: 'Only administrators can perform this action',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async markAsDelivered(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.ordersService.markAsDelivered(id);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'List all orders (Admin)',
    description:
      'Gets a paginated list of all orders in the system (only administrators)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Results per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders list retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({
    status: 403,
    description: 'Only administrators can perform this action',
  })
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
