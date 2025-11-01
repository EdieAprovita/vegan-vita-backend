/* eslint-disable no-restricted-syntax */
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { Category } from './products/entities/category.entity';
import { Product } from './products/entities/product.entity';
import { User } from './auth/entities/user.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const dataSource = app.get(DataSource);
  const categoryRepo = dataSource.getRepository(Category);
  const productRepo = dataSource.getRepository(Product);
  const userRepo = dataSource.getRepository(User);

  // Seed Users
  console.log('\n👥 Seeding users...');
  const users = [
    {
      name: 'Admin User',
      email: 'admin@veganvita.com',
      password: await bcrypt.hash('Admin123!', 10),
      isAdmin: true,
    },
    {
      name: 'John Doe',
      email: 'john@example.com',
      password: await bcrypt.hash('Test123!', 10),
      isAdmin: false,
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: await bcrypt.hash('Test123!', 10),
      isAdmin: false,
    },
  ];

  for (const userData of users) {
    const exists = await userRepo.findOne({ where: { email: userData.email } });
    if (exists) {
      console.log(`⏭️  Usuario ya existe: ${userData.email}`);
    } else {
      await userRepo.save(userData);
      console.log(
        `✅ Usuario creado: ${userData.email} ${userData.isAdmin ? '(Admin)' : ''}`,
      );
    }
  }

  // Seed Categories
  console.log('\n📁 Seeding categories...');
  const categories = [
    {
      name: 'Proteínas Vegetales',
      slug: 'proteinas-vegetales',
      description: 'Alimentos ricos en proteína de origen vegetal',
    },
    {
      name: 'Superfoods',
      slug: 'superfoods',
      description: 'Alimentos nutricionalmente densos',
    },
    {
      name: 'Bebidas Veganas',
      slug: 'bebidas-veganas',
      description: 'Bebidas deliciosas sin ingredientes de origen animal',
    },
    {
      name: 'Snacks Saludables',
      slug: 'snacks-saludables',
      description: 'Opciones nutritivas para picar entre comidas',
    },
  ];

  const categoryMap = new Map<string, Category>();
  for (const categoryData of categories) {
    let category = await categoryRepo.findOne({
      where: { slug: categoryData.slug },
    });
    if (category) {
      console.log(`⏭️  Categoría ya existe: ${categoryData.name}`);
    } else {
      category = await categoryRepo.save(categoryData);
      console.log(`✅ Categoría creada: ${categoryData.name}`);
    }
    categoryMap.set(categoryData.slug, category);
  }

  // Seed Products
  console.log('\n🛒 Seeding products...');
  const products = [
    {
      name: 'Tofu Orgánico Extra Firme',
      slug: 'tofu-organico-extra-firme',
      description:
        'Tofu orgánico de alta calidad, perfecto para marinar y cocinar',
      price: 4.99,
      stock: 50,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      category: categoryMap.get('proteinas-vegetales'),
    },
    {
      name: 'Tempeh de Garbanzos',
      slug: 'tempeh-garbanzos',
      description: 'Tempeh fermentado de garbanzos con probióticos naturales',
      price: 6.99,
      stock: 35,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      category: categoryMap.get('proteinas-vegetales'),
    },
    {
      name: 'Spirulina en Polvo Orgánica',
      slug: 'spirulina-polvo-organica',
      description: 'Superalimento rico en proteínas, vitaminas y minerales',
      price: 12.99,
      stock: 60,
      image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71',
      category: categoryMap.get('superfoods'),
    },
    {
      name: 'Semillas de Chía Orgánicas',
      slug: 'semillas-chia-organicas',
      description: 'Ricas en omega-3, fibra y antioxidantes',
      price: 8.99,
      stock: 100,
      image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71',
      category: categoryMap.get('superfoods'),
    },
    {
      name: 'Leche de Avena Barista',
      slug: 'leche-avena-barista',
      description: 'Perfecta para café y espuma de leche vegana',
      price: 3.99,
      stock: 80,
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150',
      category: categoryMap.get('bebidas-veganas'),
    },
    {
      name: 'Kombucha Jengibre y Limón',
      slug: 'kombucha-jengibre-limon',
      description: 'Bebida fermentada probiótica refrescante',
      price: 4.5,
      stock: 45,
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150',
      category: categoryMap.get('bebidas-veganas'),
    },
    {
      name: 'Mix de Frutos Secos Crudos',
      slug: 'mix-frutos-secos-crudos',
      description: 'Almendras, nueces, anacardos y avellanas sin sal',
      price: 9.99,
      stock: 70,
      image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32',
      category: categoryMap.get('snacks-saludables'),
    },
    {
      name: 'Barritas Energéticas Dátiles y Cacao',
      slug: 'barritas-energeticas-datiles-cacao',
      description: 'Snack natural sin azúcares añadidos',
      price: 2.99,
      stock: 120,
      image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32',
      category: categoryMap.get('snacks-saludables'),
    },
  ];

  for (const productData of products) {
    const exists = await productRepo.findOne({
      where: { slug: productData.slug },
    });
    if (exists) {
      console.log(`⏭️  Producto ya existe: ${productData.name}`);
    } else {
      await productRepo.save(productData);
      console.log(`✅ Producto creado: ${productData.name}`);
    }
  }

  console.log('\n✨ Seeding completado');
  await app.close();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  await seed();
})().catch(console.error);
