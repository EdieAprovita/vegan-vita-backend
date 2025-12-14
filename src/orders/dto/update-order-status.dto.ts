import { IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../entities/order-status.enum';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New order status',
    enum: OrderStatus,
    example: OrderStatus.PAID,
  })
  @IsEnum(OrderStatus, {
    message:
      'Status must be one of: pending, processing, paid, shipped, delivered, cancelled',
  })
  status: OrderStatus;

  @ApiPropertyOptional({
    description: 'Payment result (optional)',
    example: {
      id: 'pi_1234567890',
      status: 'succeeded',
      update_time: '2025-12-14T10:00:00Z',
      email_address: 'customer@example.com',
    },
  })
  @IsObject()
  @IsOptional()
  paymentResult?: {
    id?: string;
    status?: string;
    update_time?: string;
    email_address?: string;
  };
}
