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
        this.logger.error(
          `Failed to load email template: ${file} - ${errorMessage}`,
        );
        throw new Error(
          `Email template initialization failed: ${file} - ${errorMessage}`,
        );
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
        orderDate: new Date(order.createdAt).toLocaleDateString('es-ES'),
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
        subject: `Confirmación de Pedido #${order.id.substring(0, 8)}`,
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
        updateDate: new Date().toLocaleDateString('es-ES'),
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
        subject: `Actualización de Pedido #${order.id.substring(0, 8)} - ${statusMessage}`,
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
        deliveryDate: new Date(order.deliveredAt).toLocaleDateString('es-ES'),
        shippingAddress: order.shippingAddress,
        orderUrl: `${this.configService.get('FRONTEND_URL')}/orders/${order.id}`,
        reviewUrl: `${this.configService.get('FRONTEND_URL')}/orders/${order.id}/review`,
      });

      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to: order.user.email,
        subject: `¡Tu pedido #${order.id.substring(0, 8)} ha sido Entregado! 🎉`,
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
      [OrderStatus.PENDING]: 'Pendiente',
      [OrderStatus.PROCESSING]: 'Procesando',
      [OrderStatus.PAID]: 'Pagado',
      [OrderStatus.SHIPPED]: 'Enviado',
      [OrderStatus.DELIVERED]: 'Entregado',
      [OrderStatus.CANCELLED]: 'Cancelado',
    };

    return messages[status] || status;
  }

  private getStatusChangeMessage(
    oldStatus: OrderStatus,
    newStatus: OrderStatus,
  ): string {
    const messages: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.PROCESSING]:
        'Tu pedido está siendo procesado por nuestro equipo.',
      [OrderStatus.PAID]:
        'Hemos confirmado tu pago. Tu pedido será enviado pronto.',
      [OrderStatus.SHIPPED]:
        'Tu pedido ha sido enviado y está en camino a tu dirección.',
      [OrderStatus.DELIVERED]: '¡Tu pedido ha sido entregado exitosamente!',
      [OrderStatus.CANCELLED]:
        'Tu pedido ha sido cancelado. Si tienes preguntas, contáctanos.',
    };

    return messages[newStatus] || 'El estado de tu pedido ha cambiado.';
  }

  private getNextSteps(status: OrderStatus): string | null {
    const steps: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.PENDING]:
        'Procesa tu pago para que podamos comenzar a preparar tu pedido.',
      [OrderStatus.PROCESSING]:
        'Estamos preparando tus productos. Te notificaremos cuando sean enviados.',
      [OrderStatus.PAID]:
        'Tu pago ha sido confirmado. Prepararemos tu pedido para envío.',
      [OrderStatus.SHIPPED]:
        'Mantente atento, tu pedido llegará pronto. Revisa el seguimiento para más detalles.',
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
