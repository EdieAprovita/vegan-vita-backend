import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  UseGuards,
  Headers,
  RawBodyRequest,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto, PaymentIntentResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import Stripe from 'stripe';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
    @Request() req: RequestWithUser,
  ): Promise<PaymentIntentResponseDto> {
    return this.paymentsService.createPaymentIntent(
      createPaymentIntentDto.orderId,
      req.user.id,
    );
  }

  @Get(':paymentIntentId')
  @UseGuards(JwtAuthGuard)
  async getPaymentIntent(
    @Param('paymentIntentId') paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    return this.paymentsService.getPaymentIntent(paymentIntentId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Request() req: RawBodyRequest<Request>,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    if (!req.rawBody) {
      throw new Error('Missing raw body');
    }

    await this.paymentsService.handleWebhookEvent(
      signature,
      Buffer.from(req.rawBody),
    );

    return { received: true };
  }
}
