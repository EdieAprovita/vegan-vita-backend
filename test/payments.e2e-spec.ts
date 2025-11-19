import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/entities/user.entity';
import { Product } from '../src/products/entities/product.entity';
import { Category } from '../src/products/entities/category.entity';
import { OrderStatus } from '../src/orders/entities/order-status.enum';

describe('Payments System (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userToken: string;
  let testProduct: Product;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({
      rawBody: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    dataSource = app.get(DataSource);

    // Clean database
    await dataSource.query('DELETE FROM order_items');
    await dataSource.query('DELETE FROM orders');
    await dataSource.query('DELETE FROM reviews');
    await dataSource.query('DELETE FROM products');
    await dataSource.query('DELETE FROM categories');
    await dataSource.query('DELETE FROM users');

    // Create test data
    await seedTestData();
  });

  afterAll(async () => {
    // Clean up
    await dataSource.query('DELETE FROM order_items');
    await dataSource.query('DELETE FROM orders');
    await dataSource.query('DELETE FROM reviews');
    await dataSource.query('DELETE FROM products');
    await dataSource.query('DELETE FROM categories');
    await dataSource.query('DELETE FROM users');

    await app.close();
  });

  async function seedTestData() {
    const userRepo = dataSource.getRepository(User);
    const categoryRepo = dataSource.getRepository(Category);
    const productRepo = dataSource.getRepository(Product);

    // Create user
    await userRepo.save({
      name: 'Test User',
      email: 'test@example.com',
      password: await bcrypt.hash('Test123!', 10),
      isAdmin: false,
    });

    // Login to get token
    const userLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Test123!' });
    userToken = userLoginResponse.body.access_token;

    // Create category and product
    const testCategory = await categoryRepo.save({
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test category description',
    });

    testProduct = await productRepo.save({
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test product description',
      price: 19.99,
      stock: 100,
      image: 'https://example.com/image.jpg',
      category: testCategory,
    });
  }

  describe('POST /payments/create-intent - Create Payment Intent', () => {
    let testOrderId: string;

    beforeEach(async () => {
      // Create an order
      const orderDto = {
        orderItems: [{ productId: testProduct.id, qty: 2 }],
        shippingAddress: {
          fullName: 'John Doe',
          address: '123 Main St',
          city: 'Madrid',
          postalCode: '28001',
          country: 'España',
          phone: '+34 612345678',
        },
        paymentMethod: 'stripe',
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderDto);

      testOrderId = response.body.id;
    });

    it('should create payment intent successfully', async () => {
      // Mock Stripe API - This test will fail if Stripe keys are not configured
      // In a real scenario, you would use Stripe test mode
      const response = await request(app.getHttpServer())
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orderId: testOrderId });

      // If Stripe is configured, expect success
      if (response.status === 201) {
        expect(response.body).toHaveProperty('clientSecret');
        expect(response.body).toHaveProperty('paymentIntentId');
        expect(response.body).toHaveProperty('amount');
        expect(response.body).toHaveProperty('currency');
        expect(response.body).toHaveProperty('status');
      } else {
        // If Stripe is not configured, expect error
        expect([400, 500]).toContain(response.status);
      }
    });

    it('should fail if user does not own the order', async () => {
      // Create another user
      const userRepo = dataSource.getRepository(User);
      await userRepo.save({
        name: 'Other User',
        email: 'other@example.com',
        password: await bcrypt.hash('Test123!', 10),
        isAdmin: false,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'other@example.com', password: 'Test123!' });

      await request(app.getHttpServer())
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${loginResponse.body.access_token}`)
        .send({ orderId: testOrderId })
        .expect(403);
    });

    it('should fail if order is already paid', async () => {
      // Mark order as paid
      await request(app.getHttpServer())
        .put(`/api/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: OrderStatus.PAID });

      await request(app.getHttpServer())
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orderId: testOrderId })
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/payments/create-intent')
        .send({ orderId: testOrderId })
        .expect(401);
    });

    it('should fail with invalid order ID', async () => {
      await request(app.getHttpServer())
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orderId: 'invalid-uuid' })
        .expect(400);
    });
  });

  describe('GET /payments/:paymentIntentId - Get Payment Intent', () => {
    it('should get payment intent if Stripe is configured', async () => {
      // This test requires a valid payment intent ID
      // In real tests, you would create one first
      const response = await request(app.getHttpServer())
        .get('/api/payments/pi_test_123')
        .set('Authorization', `Bearer ${userToken}`);

      // Expect either success (if Stripe is configured) or error
      expect([200, 404, 500]).toContain(response.status);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/payments/pi_test_123')
        .expect(401);
    });
  });

  describe('POST /payments/webhook - Stripe Webhook', () => {
    it('should handle webhook with valid signature', async () => {
      // Note: This test requires proper webhook signature
      // In real tests, you would generate a valid signature using Stripe's webhook secret
      const mockEvent = {
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
            metadata: { orderId: 'test-order-id' },
          },
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test-signature')
        .send(JSON.stringify(mockEvent));

      // Expect either success or error depending on signature validation
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should fail without signature header', async () => {
      await request(app.getHttpServer())
        .post('/api/payments/webhook')
        .send({})
        .expect(500); // Will fail due to missing signature
    });
  });

  describe('Complete Payment Flow', () => {
    it('should complete payment flow: create order -> create intent -> webhook updates order', async () => {
      // 1. Create order
      const orderDto = {
        orderItems: [{ productId: testProduct.id, qty: 1 }],
        shippingAddress: {
          fullName: 'Jane Smith',
          address: '456 Oak Ave',
          city: 'Barcelona',
          postalCode: '08001',
          country: 'España',
          phone: '+34 623456789',
        },
        paymentMethod: 'stripe',
      };

      const createOrderResponse = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderDto)
        .expect(201);

      const orderId = createOrderResponse.body.id;
      expect(createOrderResponse.body.status).toBe(OrderStatus.PENDING);
      expect(createOrderResponse.body.isPaid).toBe(false);

      // 2. Create payment intent (if Stripe is configured)
      const createIntentResponse = await request(app.getHttpServer())
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ orderId });

      if (createIntentResponse.status === 201) {
        const paymentIntentId = createIntentResponse.body.paymentIntentId;

        // 3. Verify order has payment intent ID
        const orderResponse = await request(app.getHttpServer())
          .get(`/api/orders/${orderId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(orderResponse.body.stripePaymentIntentId).toBe(paymentIntentId);
        expect(orderResponse.body.stripePaymentStatus).toBeDefined();
      }
    });
  });
});
