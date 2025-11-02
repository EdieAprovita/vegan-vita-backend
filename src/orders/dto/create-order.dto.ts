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
import { OrderItemDto } from './order-item.dto';
import { ShippingAddressDto } from './shipping-address.dto';

export class CreateOrderDto {
  @IsArray({ message: 'Los items deben ser un array' })
  @ArrayMinSize(1, { message: 'Debe haber al menos un item en la orden' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems: OrderItemDto[];

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsString()
  @IsNotEmpty({ message: 'El método de pago es requerido' })
  paymentMethod: string;

  @IsNumber()
  @Min(0, { message: 'El precio de envío no puede ser negativo' })
  @IsOptional()
  shippingPrice?: number;

  @IsNumber()
  @Min(0, { message: 'El precio de impuestos no puede ser negativo' })
  @IsOptional()
  taxPrice?: number;
}
