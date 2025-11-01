import * as dotenv from 'dotenv';
import { join } from 'path';

// Load .env.test file for E2E tests
// IMPORTANTE: Este archivo debe cargarse ANTES de cualquier import que use variables de entorno
const result = dotenv.config({ path: join(__dirname, '..', '.env.test') });

if (result.error) {
  console.error('Error loading .env.test file:', result.error);
} else {
  console.log('✓ E2E environment loaded from .env.test');
}
