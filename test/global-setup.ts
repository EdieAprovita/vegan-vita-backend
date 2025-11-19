import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { existsSync } from 'fs';
import { validatePort } from '../src/common/utils/validation.utils';

export default async function globalSetup() {
  console.log('\n🔄 Initializing E2E Test Environment...\n');

  // Load .env.test file for E2E tests (local development)
  // In CI/CD, environment variables are passed directly
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

  // Verify critical environment variables
  const requiredEnvVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
  ];

  // Inject dummy Stripe keys for testing if not present
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('ℹ️ Injecting dummy STRIPE_SECRET_KEY for tests');
    process.env.STRIPE_SECRET_KEY = 'sk_test_123456789012345678901234'; // Must be > 24 chars
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.log('ℹ️ Injecting dummy STRIPE_WEBHOOK_SECRET for tests');
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_12345678901234567890123456789012'; // Must be > 32 chars
  }

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]?.trim(),
  );

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    throw new Error(`Missing env vars: ${missingVars.join(', ')}`);
  }

  console.log('✅ All required environment variables present');

  // Validate DB_PORT using shared utility
  const port = validatePort(process.env.DB_PORT || '5432', 'DB_PORT');

  // Create test database connection
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('🔌 Testing database connection...');
    await dataSource.initialize();

    // Verify that we can execute queries
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
