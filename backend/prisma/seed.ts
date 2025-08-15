import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting essential database seed...');

  // Environment safety check
  if (process.env.NODE_ENV === 'production') {
    console.log('🔐 Running production-safe essential seeding...');
  }

  // Create admin user
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('VibesAdmin@2025!Store', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@vibesinthreads.store' },
    update: {},
    create: {
      email: 'admin@vibesinthreads.store',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true
    }
  });

  console.log('✅ Created admin user:', adminUser.email);
  console.log('✅ Essential database seeding completed!');
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('💡 Run "npm run db:seed-dev" to add development data (categories, products)');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });