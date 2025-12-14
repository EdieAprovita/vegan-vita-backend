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
  Inject,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsMockService } from './payments-mock.service';
import { CreatePaymentIntentDto, PaymentIntentResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { PAYMENTS_SERVICE } from './interfaces/payment-service.interface';

@Controller('payments')
export class PaymentsController {
  private readonly isDummyMode: boolean;

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentsMockService: PaymentsMockService,
    private readonly configService: ConfigService,
    @Inject(PAYMENTS_SERVICE) private readonly paymentsMode: string | null,
  ) {
    this.isDummyMode = this.paymentsMode === 'dummy';
  }

  /**
   * Get current payment mode
   */
  @Get('mode')
  getPaymentMode(): { mode: string; isDummy: boolean; message: string } {
    return {
      mode: this.isDummyMode ? 'dummy' : 'stripe',
      isDummy: this.isDummyMode,
      message: this.isDummyMode
        ? '⚠️ MODO DUMMY activo - Los pagos NO son reales'
        : '💳 MODO STRIPE activo - Los pagos son REALES',
    };
  }

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
    @Request() req: RequestWithUser,
  ): Promise<PaymentIntentResponseDto> {
    if (this.isDummyMode) {
      return this.paymentsMockService.createPaymentIntent(
        createPaymentIntentDto.orderId,
        req.user.id,
      );
    }
    return this.paymentsService.createPaymentIntent(
      createPaymentIntentDto.orderId,
      req.user.id,
    );
  }

  @Get(':paymentIntentId')
  @UseGuards(JwtAuthGuard)
  async getPaymentIntent(
    @Param('paymentIntentId') paymentIntentId: string,
  ): Promise<any> {
    if (this.isDummyMode) {
      return this.paymentsMockService.getPaymentIntent(paymentIntentId);
    }
    return this.paymentsService.getPaymentIntent(paymentIntentId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Request() req: RawBodyRequest<Request>,
  ): Promise<{ received: boolean; message?: string }> {
    if (this.isDummyMode) {
      return {
        received: true,
        message: '[MOCK] Webhook recibido en modo dummy - no procesado',
      };
    }

    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    await this.paymentsService.handleWebhookEvent(
      signature,
      Buffer.from(req.rawBody),
    );

    return { received: true };
  }

  // ============================================
  // DUMMY MODE ONLY - Simulation Endpoints
  // ============================================

  /**
   * Simulate successful payment (DUMMY MODE ONLY)
   * Use this for testing without real Stripe charges
   */
  @Post('simulate/success/:orderId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async simulatePaymentSuccess(
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<{ success: boolean; message: string; order: any }> {
    this.assertDummyMode();
    return this.paymentsMockService.simulatePaymentSuccess(orderId);
  }

  /**
   * Simulate failed payment (DUMMY MODE ONLY)
   * Use this for testing payment failure scenarios
   */
  @Post('simulate/failure/:orderId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async simulatePaymentFailure(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body?: { reason?: string },
  ): Promise<{ success: boolean; message: string; order: any }> {
    this.assertDummyMode();
    return this.paymentsMockService.simulatePaymentFailure(
      orderId,
      body?.reason,
    );
  }

  /**
   * Simulate refund (DUMMY MODE ONLY)
   * Use this for testing refund scenarios
   */
  @Post('simulate/refund/:orderId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async simulateRefund(
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<{ success: boolean; message: string; order: any }> {
    this.assertDummyMode();
    return this.paymentsMockService.simulateRefund(orderId);
  }

  /**
   * Get all mock payment intents (DUMMY MODE ONLY, Admin only)
   * For debugging purposes
   */
  @Get('simulate/intents')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getAllMockPaymentIntents(): any[] {
    this.assertDummyMode();
    return this.paymentsMockService.getAllMockPaymentIntents();
  }

  /**
   * Clear all mock payment intents (DUMMY MODE ONLY, Admin only)
   * For test cleanup
   */
  @Post('simulate/clear')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  clearAllMockPaymentIntents(): { success: boolean; message: string } {
    this.assertDummyMode();
    this.paymentsMockService.clearAllMockPaymentIntents();
    return {
      success: true,
      message: '[MOCK] Todos los payment intents han sido eliminados',
    };
  }

  /**
   * Helper to assert we're in dummy mode for simulation endpoints
   */
  private assertDummyMode(): void {
    if (!this.isDummyMode) {
      throw new BadRequestException(
        'Los endpoints de simulación solo están disponibles en modo DUMMY. ' +
          'Configure PAYMENTS_MODE=dummy en .env para habilitar esta funcionalidad.',
      );
    }
  }
}
