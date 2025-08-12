import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { prisma };

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    
    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    
    console.log('✅ Database connected successfully');
    
    // Log database info in development
    if (process.env.NODE_ENV === 'development') {
      const dbName = process.env.DATABASE_URL?.includes('sqlite') ? 'SQLite' : 'PostgreSQL';
      console.log(`📊 Database: ${dbName}`);
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log('🔌 Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
  }
};