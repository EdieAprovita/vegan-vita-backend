import { IsEnum, IsOptional, IsObject } from 'class-validator';
import { OrderStatus } from '../entities/order-status.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, {
    message:
      'El estado debe ser uno de: pending, processing, paid, shipped, delivered, cancelled',
  })
  status: OrderStatus;

  @IsObject()
  @IsOptional()
  paymentResult?: {
    id?: string;
    status?: string;
    update_time?: string;
    email_address?: string;
  };
}
