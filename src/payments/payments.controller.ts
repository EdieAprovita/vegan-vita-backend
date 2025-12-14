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
  InternalServerErrorException,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsMockService } from './payments-mock.service';
import { CreatePaymentIntentDto, PaymentIntentResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { PAYMENTS_SERVICE } from './interfaces/payment-service.interface';

@ApiTags('payments')
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
  @ApiOperation({
    summary: 'Get current payment mode',
    description: 'Returns the configured payment mode (dummy or stripe)',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment mode retrieved successfully',
    schema: {
      example: {
        mode: 'dummy',
        isDummy: true,
        message: '⚠️ DUMMY MODE active - Payments are NOT real',
      },
    },
  })
  getPaymentMode(): { mode: string; isDummy: boolean; message: string } {
    return {
      mode: this.isDummyMode ? 'dummy' : 'stripe',
      isDummy: this.isDummyMode,
      message: this.isDummyMode
        ? '⚠️ DUMMY MODE active - Payments are NOT real'
        : '💳 STRIPE MODE active - Payments are REAL',
    };
  }

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create Payment Intent',
    description:
      'Creates a Stripe Payment Intent to process a payment (requires authentication)',
  })
  @ApiBody({ type: CreatePaymentIntentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment Intent created successfully',
    type: PaymentIntentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get Payment Intent',
    description:
      'Gets the status of a specific Payment Intent (requires authentication)',
  })
  @ApiParam({
    name: 'paymentIntentId',
    description: 'Payment Intent ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Payment Intent retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 404, description: 'Payment Intent not found' })
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
  @ApiOperation({
    summary: 'Stripe Webhook',
    description:
      'Endpoint to receive Stripe webhook events (no authentication required)',
  })
  @ApiHeader({
    name: 'stripe-signature',
    description: 'Stripe signature to verify the webhook',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Webhook received successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature or missing body',
  })
  @ApiResponse({
    status: 500,
    description: 'Missing stripe-signature header',
  })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Request() req: RawBodyRequest<Request>,
  ): Promise<{ received: boolean; message?: string }> {
    // Check for signature header first - required for all modes
    if (!signature) {
      throw new InternalServerErrorException('Missing stripe-signature header');
    }

    if (this.isDummyMode) {
      return {
        received: true,
        message: '[MOCK] Webhook received in dummy mode - not processed',
      };
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
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simulate successful payment (DUMMY mode only)',
    description:
      'Simulates a successful payment for testing (only available in dummy mode)',
  })
  @ApiParam({
    name: 'orderId',
    description: 'Order ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Payment simulated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Dummy mode not active or invalid data',
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simulate failed payment (DUMMY mode only)',
    description:
      'Simulates a failed payment for testing (only available in dummy mode)',
  })
  @ApiParam({
    name: 'orderId',
    description: 'Order ID',
    type: String,
    format: 'uuid',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', example: 'Insufficient funds' },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Failed payment simulated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Dummy mode not active or invalid data',
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simulate refund (DUMMY mode only)',
    description:
      'Simulates a refund for testing (only available in dummy mode)',
  })
  @ApiParam({
    name: 'orderId',
    description: 'Order ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'Refund simulated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Dummy mode not active or invalid data',
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all mock Payment Intents (DUMMY mode only, Admin)',
    description:
      'Gets all simulated payment intents for debugging (admin only in dummy mode)',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment intents list retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Dummy mode not active' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Administrators only' })
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
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear all mock Payment Intents (DUMMY mode only, Admin)',
    description:
      'Deletes all simulated payment intents (admin only in dummy mode)',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment intents deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Dummy mode not active' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Administrators only' })
  clearAllMockPaymentIntents(): { success: boolean; message: string } {
    this.assertDummyMode();
    this.paymentsMockService.clearAllMockPaymentIntents();
    return {
      success: true,
      message: '[MOCK] All payment intents have been deleted',
    };
  }

  /**
   * Helper to assert we're in dummy mode for simulation endpoints
   */
  private assertDummyMode(): void {
    if (!this.isDummyMode) {
      throw new BadRequestException(
        'Simulation endpoints are only available in DUMMY mode. ' +
          'Set PAYMENTS_MODE=dummy in .env to enable this functionality.',
      );
    }
  }
}
