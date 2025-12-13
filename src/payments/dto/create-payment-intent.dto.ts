import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsString()
  @IsNotEmpty({ message: 'El ID de la orden es requerido' })
  @IsUUID('4', { message: 'El ID de la orden debe ser un UUID válido' })
  orderId: string;
}
