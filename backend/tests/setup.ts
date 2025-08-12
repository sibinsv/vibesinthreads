import { PrismaClient } from '@prisma/client';

// Global test setup
declare global {
  var __PRISMA__: PrismaClient;
}

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.DATABASE_URL = 'file:./tests/test.db';

let prisma: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  global.__PRISMA__ = prisma;

  // Clean database and apply schema
  try {
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF;`;
    
    // Get all table names
    const tables = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations';
    `;

    // Drop all tables
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table.name}";`);
    }

    await prisma.$executeRaw`PRAGMA foreign_keys = ON;`;
  } catch (error) {
    // Ignore errors if tables don't exist
  }

  // Push schema to test database
  const { execSync } = require('child_process');
  execSync('npx prisma db push --force-reset', { 
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: 'pipe'
  });
});

afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});

beforeEach(async () => {
  // Clean all data between tests
  const tablesToClean = ['products', 'categories', 'users', 'orders', 'order_items', 'product_images', 'product_variants', 'product_attributes', 'addresses'];
  
  for (const table of tablesToClean) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
    } catch (error) {
      // Ignore if table doesn't exist
    }
  }
});