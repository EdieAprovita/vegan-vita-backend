import { DataSource } from 'typeorm';

export default async function globalSetup() {
  console.log('\n🔄 Initializing E2E Test Environment...\n');

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
