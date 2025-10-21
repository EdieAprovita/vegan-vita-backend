import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { User } from './auth/entities/user.entity';
import { Product, Category, Review } from './products/entities';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [User, Product, Category, Review],
        synchronize: true,
        logging: false,
        retryAttempts: 10,
        retryDelay: 3000,
        connectTimeoutMS: 10000,
      }),
    }),
    AuthModule,
    ProductsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
