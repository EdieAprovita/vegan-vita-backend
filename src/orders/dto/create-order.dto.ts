import {
  IsArray,
  ValidateNested,
  IsString,
  IsNotEmpty,
  ArrayMinSize,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderItemDto } from './order-item.dto';
import { ShippingAddressDto } from './shipping-address.dto';

export class CreateOrderDto {
  @ApiProperty({
    description: 'List of products in the order',
    type: [OrderItemDto],
    example: [
      {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        qty: 2,
      },
    ],
  })
  @IsArray({ message: 'Items must be an array' })
  @ArrayMinSize(1, { message: 'There must be at least one item in the order' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems: OrderItemDto[];

  @ApiProperty({
    description: 'Shipping address',
    type: ShippingAddressDto,
  })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({
    description: 'Payment method',
    example: 'stripe',
    enum: ['stripe', 'paypal', 'cash'],
  })
  @IsString()
  @IsNotEmpty({ message: 'Payment method is required' })
  paymentMethod: string;

  @ApiPropertyOptional({
    description: 'Shipping price in USD',
    example: 5.99,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'Shipping price cannot be negative' })
  @IsOptional()
  shippingPrice?: number;

  @ApiPropertyOptional({
    description: 'Tax price in USD',
    example: 2.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'Tax price cannot be negative' })
  @IsOptional()
  taxPrice?: number;
}
