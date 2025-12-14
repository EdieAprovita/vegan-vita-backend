import { ApiProperty } from '@nestjs/swagger';

export class PaymentIntentResponseDto {
  @ApiProperty({
    description: 'Client secret to complete payment in the frontend',
    example: 'pi_1234567890_secret_abcdef',
  })
  clientSecret: string;

  @ApiProperty({
    description: 'Payment Intent ID',
    example: 'pi_1234567890',
  })
  paymentIntentId: string;

  @ApiProperty({
    description: 'Payment amount in cents',
    example: 2999,
  })
  amount: number;

  @ApiProperty({
    description: 'Payment currency',
    example: 'usd',
  })
  currency: string;

  @ApiProperty({
    description: 'Payment Intent status',
    example: 'requires_payment_method',
    enum: ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'succeeded', 'canceled'],
  })
  status: string;
}
