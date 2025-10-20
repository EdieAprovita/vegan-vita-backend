import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { Category } from './products/entities/category.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const dataSource = app.get(DataSource);
  const repo = dataSource.getRepository(Category);

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

  // eslint-disable-next-line no-restricted-syntax
  for (const category of categories) {
    const exists = await repo.findOne({ where: { slug: category.slug } });
    if (exists) {
      console.log(`⏭️  Categoría ya existe: ${category.name}`);
    } else {
      await repo.save(category);
      console.log(`✅ Categoría creada: ${category.name}`);
    }
  }

  console.log('✨ Seeding completado');
  await app.close();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  await seed();
})().catch(console.error);
