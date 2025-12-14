import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for Stripe webhooks
  });
  app.setGlobalPrefix('api'); // Prefix for all endpoints
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Removes properties not defined in the DTO
      forbidNonWhitelisted: true, // Throws error if there are non-allowed properties
      transform: true, // Transforms payloads to DTO instances
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Vegan Vita API')
    .setDescription(
      'REST API for vegan products e-commerce. Complete documentation of all available endpoints.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('auth', 'Authentication and registration endpoints')
    .addTag('users', 'User management')
    .addTag('products', 'Products and reviews management')
    .addTag('orders', 'Orders management')
    .addTag('payments', 'Payment system with Stripe')
    .addTag('health', 'Server health check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keeps the token in the session
    },
  });

  await app.listen(3001);
}
bootstrap();
