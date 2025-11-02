import * as dotenv from 'dotenv';
import { join } from 'path';
import { existsSync } from 'fs';

// Load .env.test file for E2E tests (local development)
// In CI/CD, environment variables are passed directly
const envTestPath = join(__dirname, '..', '.env.test');

if (existsSync(envTestPath)) {
  const result = dotenv.config({ path: envTestPath });
  if (result.error) {
    console.warn('⚠️ Could not load .env.test:', result.error.message);
  } else {
    console.log('✓ E2E environment loaded from .env.test');
  }
} else {
  // In CI/CD, environment variables are already configured
  console.log('ℹ️ Using environment variables from CI/CD');
}
