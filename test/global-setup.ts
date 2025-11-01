import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { existsSync } from 'fs';

export default async function globalSetup() {
  console.log('\n🔄 Initializing E2E Test Environment...\n');

  // Load .env.test file for E2E tests (local development)
  // En CI/CD, las variables de entorno se pasan directamente
  const envTestPath = join(__dirname, '..', '.env.test');

  if (existsSync(envTestPath)) {
    const result = dotenv.config({ path: envTestPath });
    if (result.error) {
      console.warn('⚠️ Could not load .env.test:', result.error.message);
    } else {
      console.log('✅ Loaded .env.test file');
    }
  } else {
    console.log('ℹ️ Using environment variables from CI/CD');
  }

  // Verificar variables de entorno críticas
  const requiredEnvVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    throw new Error(`Missing env vars: ${missingVars.join(', ')}`);
  }

  console.log('✅ All required environment variables present');

  // Crear conexión de prueba a la base de datos
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('🔌 Testing database connection...');
    await dataSource.initialize();

    // Verificar que podemos hacer queries
    const result = await dataSource.query('SELECT version()');
    console.log('✅ Database connection successful');
    console.log(
      `📊 PostgreSQL version: ${result[0].version.split(' ')[0]} ${result[0].version.split(' ')[1]}`,
    );

    await dataSource.destroy();
    console.log('✅ E2E Test Environment Ready\n');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    throw error;
  }
}
