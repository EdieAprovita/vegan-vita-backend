import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/entities/user.entity';
import { Product } from '../src/products/entities/product.entity';
import { Category } from '../src/products/entities/category.entity';
import { OrderStatus } from '../src/orders/entities/order-status.enum';

describe('Orders System (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userToken: string;
  let adminToken: string;
  let testUser: User;
  let testProduct: Product;
  let testCategory: Category;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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

    // Create users
    testUser = await userRepo.save({
      name: 'Test User',
      email: 'test@example.com',
      password: await bcrypt.hash('Test123!', 10),
      isAdmin: false,
    });

    await userRepo.save({
      name: 'Test Admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('Admin123!', 10),
      isAdmin: true,
    });

    // Login to get tokens
    const userLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Test123!' });
    userToken = userLoginResponse.body.access_token;

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Admin123!' });
    adminToken = adminLoginResponse.body.access_token;

    // Create category and product
    testCategory = await categoryRepo.save({
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

  describe('POST /orders - Create Order', () => {
    it('should create an order successfully', async () => {
      const orderDto = {
        orderItems: [
          {
            productId: testProduct.id,
            qty: 2,
          },
        ],
        shippingAddress: {
          fullName: 'John Doe',
          address: '123 Main St',
          city: 'Madrid',
          postalCode: '28001',
          country: 'España',
          phone: '+34 612345678',
        },
        paymentMethod: 'credit_card',
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderDto)
        .expect(201);

      expect(response.body).toMatchObject({
        user: { id: testUser.id },
        status: OrderStatus.PENDING,
        itemsPrice: 39.98,
        shippingPrice: 0,
        taxPrice: expect.any(String),
        totalPrice: expect.any(String),
        isPaid: false,
        isDelivered: false,
      });

      expect(response.body.orderItems).toHaveLength(1);
      expect(response.body.orderItems[0]).toMatchObject({
        name: testProduct.name,
        qty: 2,
        price: '19.99',
      });

      // Verify stock was reduced
      const updatedProduct = await dataSource
        .getRepository(Product)
        .findOne({ where: { id: testProduct.id } });
      expect(updatedProduct.stock).toBe(98);
    });

    it('should fail when product is out of stock', async () => {
      const orderDto = {
        orderItems: [
          {
            productId: testProduct.id,
            qty: 150, // More than available
          },
        ],
        shippingAddress: {
          fullName: 'John Doe',
          address: '123 Main St',
          city: 'Madrid',
          postalCode: '28001',
          country: 'España',
          phone: '+34 612345678',
        },
        paymentMethod: 'credit_card',
      };

      await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderDto)
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/orders')
        .send({})
        .expect(401);
    });

    it('should fail with invalid order data', async () => {
      await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderItems: [], // Empty array
          shippingAddress: {},
          paymentMethod: '',
        })
        .expect(400);
    });
  });

  describe('GET /orders/myorders - Get User Orders', () => {
    it('should return user orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/orders/myorders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('status');
      expect(response.body[0]).toHaveProperty('totalPrice');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/orders/myorders')
        .expect(401);
    });
  });

  describe('GET /orders/:id - Get Order by ID', () => {
    let testOrderId: string;

    beforeAll(async () => {
      // Create an order
      const orderDto = {
        orderItems: [{ productId: testProduct.id, qty: 1 }],
        shippingAddress: {
          fullName: 'John Doe',
          address: '123 Main St',
          city: 'Madrid',
          postalCode: '28001',
          country: 'España',
          phone: '+34 612345678',
        },
        paymentMethod: 'credit_card',
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderDto);

      testOrderId = response.body.id;
    });

    it('should get order by id for owner', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testOrderId);
      expect(response.body).toHaveProperty('orderItems');
      expect(response.body.user.id).toBe(testUser.id);
    });

    it('should get order by id for admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testOrderId);
    });

    it('should fail for non-owner user', async () => {
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
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${loginResponse.body.access_token}`)
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/orders/${testOrderId}`)
        .expect(401);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .get('/api/orders/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('PUT /orders/:id/status - Update Order Status', () => {
    let testOrderId: string;

    beforeEach(async () => {
      const orderDto = {
        orderItems: [{ productId: testProduct.id, qty: 1 }],
        shippingAddress: {
          fullName: 'John Doe',
          address: '123 Main St',
          city: 'Madrid',
          postalCode: '28001',
          country: 'España',
          phone: '+34 612345678',
        },
        paymentMethod: 'credit_card',
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderDto);

      testOrderId = response.body.id;
    });

    it('should update order status (owner)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: OrderStatus.PROCESSING })
        .expect(200);

      expect(response.body.status).toBe(OrderStatus.PROCESSING);
    });

    it('should update order status (admin)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.PAID })
        .expect(200);

      expect(response.body.status).toBe(OrderStatus.PAID);
    });

    it('should fail with invalid status', async () => {
      await request(app.getHttpServer())
        .put(`/api/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .put(`/api/orders/${testOrderId}/status`)
        .send({ status: OrderStatus.PROCESSING })
        .expect(401);
    });
  });

  describe('PUT /orders/:id/deliver - Mark as Delivered', () => {
    let testOrderId: string;

    beforeEach(async () => {
      const orderDto = {
        orderItems: [{ productId: testProduct.id, qty: 1 }],
        shippingAddress: {
          fullName: 'John Doe',
          address: '123 Main St',
          city: 'Madrid',
          postalCode: '28001',
          country: 'España',
          phone: '+34 612345678',
        },
        paymentMethod: 'credit_card',
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderDto);

      testOrderId = response.body.id;
    });

    it('should mark order as delivered (admin)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/orders/${testOrderId}/deliver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.isDelivered).toBe(true);
      expect(response.body.deliveredAt).toBeDefined();
      expect(response.body.status).toBe(OrderStatus.DELIVERED);
    });

    it('should fail for non-admin user', async () => {
      await request(app.getHttpServer())
        .put(`/api/orders/${testOrderId}/deliver`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .put(`/api/orders/${testOrderId}/deliver`)
        .expect(401);
    });
  });

  describe('GET /orders - Get All Orders (Admin)', () => {
    beforeAll(async () => {
      // Create multiple orders
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            orderItems: [{ productId: testProduct.id, qty: 1 }],
            shippingAddress: {
              fullName: 'John Doe',
              address: '123 Main St',
              city: 'Madrid',
              postalCode: '28001',
              country: 'España',
              phone: '+34 612345678',
            },
            paymentMethod: 'credit_card',
          });
      }
    });

    it('should get paginated orders (admin)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.orders)).toBe(true);
      expect(response.body.orders.length).toBeGreaterThan(0);
    });

    it('should fail for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get('/api/orders').expect(401);
    });
  });

  describe('Complete Order Lifecycle', () => {
    it('should complete full order workflow', async () => {
      // 1. Create order
      const createResponse = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderItems: [{ productId: testProduct.id, qty: 3 }],
          shippingAddress: {
            fullName: 'Jane Smith',
            address: '456 Oak Ave',
            city: 'Barcelona',
            postalCode: '08001',
            country: 'España',
            phone: '+34 623456789',
          },
          paymentMethod: 'paypal',
        })
        .expect(201);

      const orderId = createResponse.body.id;
      expect(createResponse.body.status).toBe(OrderStatus.PENDING);

      // 2. Update to processing
      const processingResponse = await request(app.getHttpServer())
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.PROCESSING })
        .expect(200);
      expect(processingResponse.body.status).toBe(OrderStatus.PROCESSING);

      // 3. Mark as paid
      const paidResponse = await request(app.getHttpServer())
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.PAID })
        .expect(200);
      expect(paidResponse.body.status).toBe(OrderStatus.PAID);

      // 4. Mark as shipped
      const shippedResponse = await request(app.getHttpServer())
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.SHIPPED })
        .expect(200);
      expect(shippedResponse.body.status).toBe(OrderStatus.SHIPPED);

      // 5. Mark as delivered
      const deliveredResponse = await request(app.getHttpServer())
        .put(`/api/orders/${orderId}/deliver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(deliveredResponse.body.status).toBe(OrderStatus.DELIVERED);
      expect(deliveredResponse.body.isDelivered).toBe(true);
      expect(deliveredResponse.body.deliveredAt).toBeDefined();

      // 6. Verify final state
      const finalResponse = await request(app.getHttpServer())
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(finalResponse.body).toMatchObject({
        id: orderId,
        status: OrderStatus.DELIVERED,
        isDelivered: true,
        isPaid: false, // Not marked as paid separately in this flow
      });
    });
  });
});
