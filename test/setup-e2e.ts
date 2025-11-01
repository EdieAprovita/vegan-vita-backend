import * as dotenv from 'dotenv';
import { join } from 'path';

// Load .env.test file for E2E tests
dotenv.config({ path: join(__dirname, '..', '.env.test') });
