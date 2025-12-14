import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/entities/order-status.enum';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000; // Base delay for exponential backoff

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
    this.loadTemplates();
  }

  private initializeTransporter() {
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: smtpPort,
      secure: smtpPort === 465, // true for 465 (SSL), false for other ports (587 uses STARTTLS)
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  private loadTemplates() {
    const templatesDir = path.join(__dirname, 'templates');
    const templateFiles = [
      'order-confirmation.hbs',
      'status-update.hbs',
      'order-delivered.hbs',
    ];

    templateFiles.forEach((file) => {
      try {
        const filePath = path.join(templatesDir, file);
        const templateContent = fs.readFileSync(filePath, 'utf8');
        const templateName = file.replace('.hbs', '');
        this.templates.set(templateName, handlebars.compile(templateContent));
      } catch (error) {
        const errorMessage =
          error.code === 'ENOENT'
            ? `File not found: ${file}`
            : `Failed to read file: ${error.message}`;
        // Always log full details for debugging
        this.logger.error(
          `Failed to load email template: ${file} - ${errorMessage}`,
        );
        // In production, throw a generic error message
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Email template initialization failed.');
        } else {
          throw new Error(
            `Email template initialization failed: ${file} - ${errorMessage}`,
          );
        }
      }
    });

    this.logger.log(`Loaded ${this.templates.size} email templates`);
  }

  async sendOrderConfirmation(order: Order): Promise<void> {
    try {
      // Skip sending emails in test environment
      if (process.env.NODE_ENV === 'test') {
        this.logger.log(
          `[TEST] Skipping email: Order confirmation for ${order.id}`,
        );
        return;
      }

      const template = this.templates.get('order-confirmation');
      if (!template) {
        throw new Error('Order confirmation template not found');
      }

      const items = order.orderItems.map((item) => ({
        ...item,
        subtotal: (Number(item.price) * item.qty).toFixed(2),
      }));

      const html = template({
        userName: order.user.name,
        orderId: order.id,
        orderDate: new Date(order.createdAt).toLocaleDateString('en-US'),
        status: this.getStatusMessage(order.status),
        items,
        itemsPrice: Number(order.itemsPrice).toFixed(2),
        shippingPrice: Number(order.shippingPrice).toFixed(2),
        taxPrice: Number(order.taxPrice).toFixed(2),
        totalPrice: Number(order.totalPrice).toFixed(2),
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        orderUrl: `${this.configService.get('FRONTEND_URL')}/orders/${order.id}`,
      });

      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to: order.user.email,
        subject: `Order Confirmation #${order.id.substring(0, 8)}`,
        html,
      });

      this.logger.log(
        `Order confirmation email sent to ${order.user.email} for order ${order.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send order confirmation email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendStatusUpdate(
    order: Order,
    oldStatus: OrderStatus,
    newStatus: OrderStatus,
  ): Promise<void> {
    try {
      // Skip sending emails in test environment
      if (process.env.NODE_ENV === 'test') {
        this.logger.log(`[TEST] Skipping email: Status update for ${order.id}`);
        return;
      }

      const template = this.templates.get('status-update');
      if (!template) {
        throw new Error('Status update template not found');
      }

      const statusClass = newStatus.toLowerCase();
      const statusMessage = this.getStatusMessage(newStatus);
      const nextSteps = this.getNextSteps(newStatus);

      const html = template({
        userName: order.user.name,
        orderId: order.id,
        updateDate: new Date().toLocaleDateString('en-US'),
        status: statusMessage,
        statusClass,
        statusMessage,
        message: this.getStatusChangeMessage(oldStatus, newStatus),
        nextSteps,
        orderUrl: `${this.configService.get('FRONTEND_URL')}/orders/${order.id}`,
      });

      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to: order.user.email,
        subject: `Order Update #${order.id.substring(0, 8)} - ${statusMessage}`,
        html,
      });

      this.logger.log(
        `Status update email sent to ${order.user.email} for order ${order.id}: ${oldStatus} -> ${newStatus}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send status update email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendDeliveryConfirmation(order: Order): Promise<void> {
    try {
      // Skip sending emails in test environment
      if (process.env.NODE_ENV === 'test') {
        this.logger.log(
          `[TEST] Skipping email: Delivery confirmation for ${order.id}`,
        );
        return;
      }

      const template = this.templates.get('order-delivered');
      if (!template) {
        throw new Error('Order delivered template not found');
      }

      const html = template({
        userName: order.user.name,
        orderId: order.id,
        deliveryDate: new Date(order.deliveredAt).toLocaleDateString('en-US'),
        shippingAddress: order.shippingAddress,
        orderUrl: `${this.configService.get('FRONTEND_URL')}/orders/${order.id}`,
        reviewUrl: `${this.configService.get('FRONTEND_URL')}/orders/${order.id}/review`,
      });

      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to: order.user.email,
        subject: `Your Order #${order.id.substring(0, 8)} has been Delivered! 🎉`,
        html,
      });

      this.logger.log(
        `Delivery confirmation email sent to ${order.user.email} for order ${order.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send delivery confirmation email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private getStatusMessage(status: OrderStatus): string {
    const messages: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'Pending',
      [OrderStatus.PROCESSING]: 'Processing',
      [OrderStatus.PAID]: 'Paid',
      [OrderStatus.SHIPPED]: 'Shipped',
      [OrderStatus.DELIVERED]: 'Delivered',
      [OrderStatus.CANCELLED]: 'Cancelled',
    };

    return messages[status] || status;
  }

  private getStatusChangeMessage(
    oldStatus: OrderStatus,
    newStatus: OrderStatus,
  ): string {
    const messages: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.PROCESSING]: 'Your order is being processed by our team.',
      [OrderStatus.PAID]:
        'We have confirmed your payment. Your order will be shipped soon.',
      [OrderStatus.SHIPPED]:
        'Your order has been shipped and is on its way to your address.',
      [OrderStatus.DELIVERED]: 'Your order has been delivered successfully!',
      [OrderStatus.CANCELLED]:
        'Your order has been cancelled. If you have questions, please contact us.',
    };

    return messages[newStatus] || 'Your order status has changed.';
  }

  private getNextSteps(status: OrderStatus): string | null {
    const steps: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.PENDING]:
        'Process your payment so we can start preparing your order.',
      [OrderStatus.PROCESSING]:
        'We are preparing your products. We will notify you when they are shipped.',
      [OrderStatus.PAID]:
        'Your payment has been confirmed. We will prepare your order for shipping.',
      [OrderStatus.SHIPPED]:
        'Stay tuned, your order will arrive soon. Check tracking for more details.',
    };

    return steps[status] || null;
  }

  async sendWebhookNotification(event: string, order: Order): Promise<void> {
    // Webhook implementation for external integrations
    const webhookUrl = this.configService.get<string>('WEBHOOK_URL');

    if (!webhookUrl) {
      this.logger.debug(
        'No webhook URL configured, skipping webhook notification',
      );
      return;
    }

    try {
      const payload = {
        event,
        timestamp: new Date().toISOString(),
        order: {
          id: order.id,
          status: order.status,
          totalPrice: order.totalPrice,
          isPaid: order.isPaid,
          isDelivered: order.isDelivered,
        },
      };

      // Actual webhook sending would be implemented here
      // For example, using fetch or axios:
      // await fetch(process.env.WEBHOOK_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // });
      this.logger.log(
        `Webhook notification sent for event: ${event}, order: ${order.id}`,
      );
      this.logger.debug('Webhook payload:', JSON.stringify(payload));
    } catch (error) {
      this.logger.error(
        `Failed to send webhook notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
